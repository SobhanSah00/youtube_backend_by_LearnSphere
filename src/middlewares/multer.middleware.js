import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      
    // Generate a unique filename
    // const uniqueFilename = uuidv4() + path.extname(file.originalname);
    // cb(null, uniqueFilename);

      cb(null, file.originalname)
      /*in this case a potential problem is there is no way to know the original name of the file
       so we can't use the original name as the filename
       like if we add same file twice or many times , the second time will overwrite the first one */
    }
  })
  
export const upload = multer({ 
    storage, 
    //storage = storage also we write like this but we dont beacuse it is in es6 module 
})