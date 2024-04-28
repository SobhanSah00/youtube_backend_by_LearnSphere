import { asyncHandler } from "../utils/asyncHandeler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadonCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccesstokenAndRefreshTokens = async (userId) => {
  try {
    // 1 . create refresh token
    const user = await User.findById(userId);

    const accessToken = user.generateAccesstoken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //ALGORITHIM TO REGISTERING THE USER

  /*
  1 . get user details from frontend
  2 . validation - check not empty
  3 . check if user alrady exist : username, email
  4 . check for images , check for avtar
  5 . upload them to cloudynary
  6 . create user object - create entry in db
  7 . remove password and refresh token field from responce
  8 . check for user creation :  success or failure
  9 . return  json response
  */

  // 1 . get user details from frontend
  const { fullName, email, username, password } = req.body;
  // console.log("email", email);

  // 2 . validation - check not empty

  //  if(fullName === "") {
  //     throw new ApiError(400,"Full name is required")
  //  }

  if (
    [fullName, email, username, password].some(
      (fields) => fields?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // 3 . check if user alrady exist : username, email
  await User.findOne({
    $or: [{ email }, { username }],
  }).then((user) => {
    if (user) {
      throw new ApiError(409, "User already exist");
    }
  });

  // 4 . check for images , check for avtar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  } else {
    coverImageLocalPath = null;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  // 5 . upload them to cloudynary
  const avatar = await uploadonCloudinary(avatarLocalPath);
  const coverImage = await uploadonCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  // 6 . create user object - create entry in db
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    username: username.toLowerCase(),
    password,
  });

  // 7 . remove password and refresh token field from responce
  const created_user = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //8 . check for user creation :  success or failure
  if (!created_user) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // 9 . return  json response
  return res
    .status(201)
    .json(new ApiResponse(200, created_user, "User Register Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  /* ALOGIRITHIM FOR LOGIN A USER*/

  /*
  1 . get user data from request body
  2 . check if user exists
  3 . check if password is correct
  4 . access a access token
  5 . access a refresh token
  6 . send cookies
  7 . return json response 
  */

  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Please provide username or email");
  }

  /*
  await User.findOne({
    $or: [
      { email },
      { username }
    ]
  })
  .catch(() => {
    throw new ApiError(404, "Please sign up first");
  });
  */
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, "Please sign up first");
  }

  const isPasswordValidawait = user.isPasswordCorrect(password);

  if (!isPasswordValidawait) {
    throw new ApiError(401, "Please provide valid password");
  }

  const { accessToken, refreshToken } =
    await generateAccesstokenAndRefreshTokens(user._id);

  const loginuser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loginuser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "invalid refresh Token .");
    }

    if (incomingRefreshToken != user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccesstokenAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed "
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  /* 
  we can also work this we can extract the conform password and then check with new password , if 
  it is correct then procide , if it is not then give a ApiError code and message
  */

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "invalid old password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Passwrod Changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "Please provide all the required fields");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  // Step 1: Retrieve New Avatar Local Path
  const newAvatarLocalPath = req.file?.path;

  if (!newAvatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  // Step 2: Upload New Avatar to Cloudinary
  const newAvatar = await uploadonCloudinary(newAvatarLocalPath);

  if (!newAvatar.url) {
    throw new ApiError(400, "Error while uploading avatar");
  }

  // Step 3: Retrieve User Document and Previous Avatar URL
  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const previousAvatarURL = user.avatar;

  // Step 4: Delete Previous Avatar from Cloudinary
  if (previousAvatarURL) {
    const publicId = previousAvatarURL.split("/").pop().split(".")[0];
    await deleteOnCloudinary(publicId);
  }

  // Step 5: Update User's Avatar URL
  user.avatar = newAvatar.url;
  await user.save();

  // Step 6: Respond with Success
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const newCoverImageLocalPath = req.file?.path;

  if (!newCoverImageLocalPath) {
    throw new ApiError(400, "Cover Image is missing .");
  }
  const newCoverImage = await uploadonCloudinary(newCoverImageLocalPath);
  if (!newCoverImage.url) {
    throw new ApiError(400, "Error while uploading cover image");
  }

  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const previousCoverImageURL = user.coverImage;

  if (previousCoverImageURL) {
    const publicId = previousCoverImageURL.split("/").pop().split(".")[0];
    await deleteOnCloudinary(publicId);
  }

  // const user = await User.findByIdAndUpdate(
  //   req.user?._id,
  //   {
  //     $set : {
  //       coverImage : coverImage.url
  //     }
  //   },
  //   {new : true}
  // ).select("-password")

  user.coverImage = newCoverImage.url;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image is uploaded successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscriberTo", //mene kisiko subscribe kiya he
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribeToCount: {
          $size: "$subscriberTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers."] },
          },
        },
      },
    },
  ]);
}); //INCOMPLETE , BECAUSE I CAN NOT UNDERSTAND 😟😟😔😔

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentUserPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
};
