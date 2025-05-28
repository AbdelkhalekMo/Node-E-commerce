# Cloudinary Setup Instructions

To fix the image upload issue in the admin product management, you need to set up Cloudinary credentials in your `.env` file.

## Steps to Set Up Cloudinary

1. **Sign up for a free Cloudinary account**:
   - Go to [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
   - Complete the registration process

2. **Get your Cloudinary credentials**:
   - After signing in, go to your Cloudinary Dashboard
   - You'll see your Cloud Name, API Key, and API Secret

3. **Update your `.env` file**:
   - Open the `.env` file in the `NodeJs/Back-End` directory
   - Add or update the following lines with your actual credentials:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

4. **Restart your backend server** after making these changes.

## Alternative Solution

If you don't want to use Cloudinary for image uploads, the code has been modified to use the provided image URL directly. When adding or updating a product, simply provide a valid image URL in the `imageUrl` field, and it will be used without attempting to upload to Cloudinary.

## Testing

After making these changes, try adding a product again with an image URL. It should now work correctly whether you've set up Cloudinary or not. 