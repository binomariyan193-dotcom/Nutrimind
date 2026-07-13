import io
from PIL import Image, ImageEnhance, UnidentifiedImageError
from fastapi import HTTPException

class ImagePreprocessingService:
    """
    A service class for preprocessing images before storage or AI analysis.
    Pipeline: Validate -> Normalize -> Resize -> Enhance -> Strip Metadata -> Compress
    """

    MAX_WIDTH = 1920
    MAX_HEIGHT = 1080
    JPEG_QUALITY = 85

    @classmethod
    def process_image(cls, image_bytes: bytes) -> bytes:
        """
        Runs the full image preprocessing pipeline on raw image bytes.
        Returns the processed image bytes in JPEG format.
        """
        # 1. Validate Image
        try:
            img = Image.open(io.BytesIO(image_bytes))
            img.verify() # Validates the file without decoding the whole image
        except (UnidentifiedImageError, IOError):
            raise HTTPException(status_code=400, detail="Invalid or corrupted image file.")

        # Re-open the image because verify() leaves the file pointer at EOF
        img = Image.open(io.BytesIO(image_bytes))

        # 2. Normalize (Ensure RGB format, handling transparency if PNG/RGBA)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        elif img.mode != "RGB":
            img = img.convert("RGB")

        # 3. Resize (Maintain aspect ratio, max 1920x1080)
        img.thumbnail((cls.MAX_WIDTH, cls.MAX_HEIGHT), Image.Resampling.LANCZOS)

        # 4. Enhance Quality (Slight bump in contrast and sharpness for better AI detection)
        contrast_enhancer = ImageEnhance.Contrast(img)
        img = contrast_enhancer.enhance(1.1)  # 10% increase in contrast

        sharpness_enhancer = ImageEnhance.Sharpness(img)
        img = sharpness_enhancer.enhance(1.2) # 20% increase in sharpness

        # 5. Remove Metadata & Compress
        # Saving as JPEG without transferring EXIF data automatically strips metadata.
        output_buffer = io.BytesIO()
        img.save(
            output_buffer, 
            format="JPEG", 
            quality=cls.JPEG_QUALITY, 
            optimize=True
        )
        
        return output_buffer.getvalue()
