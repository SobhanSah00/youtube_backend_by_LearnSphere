class ApiError extends Error {
    constructor(
        statusCode,
        message = "something went wrong",
        errors = [],
        stack = ""
    ) {
        super(message)
        this.statusCode = statusCode
        this.errors = errors
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors
        //here we not handel the api response or error code herre we handle the api error 
        if(stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
        
    }
}

export {ApiError}