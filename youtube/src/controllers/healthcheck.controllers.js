import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandeler.js";

//TODO: build a healthcheck response that simply returns the OK status as json with a message
const healthcheck = asyncHandler(async (req, res) => {
    res.status(200).json(new ApiResponse(200,{ status: "OK", message: "Server is running" }));
});

export { healthcheck };
