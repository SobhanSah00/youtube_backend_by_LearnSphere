import {v2 as cloudinary} from 'cloudinary'
import fs from "fs" //fs represent as file system -> it is uses in managing the file 
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadonCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type : "auto"
        })
        /*file has been uploaded successfull*/

        // console.log("file is uploaded on cloudynary",response.url);
        // console.log(response);


        /*delete the local file after upload on cloudinary*/
        fs.unlinkSync(localFilePath)
        return  response;
    } catch(error) {
        fs.unlinkSync(localFilePath)//delete local file after error occured
        /*remove the loacally saved temporary file as the upload operation
        got failed*/
        // return null
        throw  new Error(error)
    }
}

const deleteOnCloudinary = async (publicId,  resource_type="image") => {
    try {
        if(!publicId) return null

        //delete file from cloudinary
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type : `${resource_type}`
        });

        console.log("file is deleted from cloudinary",response);
        return response
    } catch(error) {
        console.log("delete on cloudinary failed", error);
        throw new Error(error)
    }
}

export {uploadonCloudinary, deleteOnCloudinary}