import { asyncHandler } from "../utils/asyncHandeler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadonCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js"

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
  console.log("email", email);

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
  User.findOne({
    $or: [{ email }, { username }],
  }).then((user) => {
    if (user) {
      throw new ApiError(409, "User already exist");
    }
  });

  // 4 . check for images , check for avtar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  // 5 . upload them to cloudynary
  const avtar = await uploadonCloudinary(avatarLocalPath)
  const coverImage = await uploadonCloudinary(coverImageLocalPath)

  if(!avtar) {
    throw new ApiError(400, "Avatar is required");
  }

  // 6 . create user object - create entry in db
  const user = await User.create({
    fullName,
    avtar:avtar.url,
    coverImage:coverImage?.url || "",
    email,
    username : username.toLowerCase(),
    password,
  })

  // 7 . remove password and refresh token field from responce
  const created_user = await User.findById(user._id).select("-password -refreshToken")

  //8 . check for user creation :  success or failure
  if(!created_user) {
    throw new ApiError(500, "Something went wrong while registering the user")
  }

  // 9 . return  json response
  return res.status(201).json(
    new ApiResponse(
      200, 
      created_user, 
      "User Register Successfully")
  );

});

export { registerUser };
