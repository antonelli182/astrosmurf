import os
import boto3
from pathlib import Path
from datetime import datetime
from botocore.exceptions import ClientError

def upload_to_s3(local_file_path: str, bucket_name: str = None, s3_folder: str = "manim-videos") -> str:
    """
    Upload a file to S3 and return the public URL
    
    Args:
        local_file_path: Path to the local file to upload
        bucket_name: S3 bucket name (defaults to env variable)
        s3_folder: Folder in S3 bucket (default: "manim-videos")
    
    Returns:
        Public URL of the uploaded file
    """
    # Get bucket name from environment variable if not provided
    if bucket_name is None:
        bucket_name = os.getenv("sa_aws_bucket")
    
    if not bucket_name:
        raise ValueError("S3 bucket name not provided and sa_aws_bucket env variable not set")
    
    # Check if file exists
    if not os.path.exists(local_file_path):
        raise FileNotFoundError(f"File not found: {local_file_path}")
    
    # Generate S3 key (path in bucket)
    file_name = Path(local_file_path).name
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    s3_key = f"{s3_folder}/{timestamp}_{file_name}"
    
    # Initialize S3 client
    s3_client = boto3.client(
        's3',
        aws_access_key_id=os.getenv("sa_aws_access_key_id"),
        aws_secret_access_key=os.getenv("sa_aws_secret_access_key"),
        aws_session_token=os.getenv("sa_aws_session_token"),  # Add session token support
        region_name=os.getenv("AWS_REGION", "us-east-1")
    )
    
    try:
        # Upload file
        print(f"Uploading {local_file_path} to s3://{bucket_name}/{s3_key}")
        
        # Determine content type based on file extension
        content_type = "video/mp4" if file_name.endswith(".mp4") else "application/octet-stream"
        
        s3_client.upload_file(
            local_file_path,
            bucket_name,
            s3_key,
            ExtraArgs={
                'ContentType': content_type
                # Note: ACL removed - use bucket policy for public access instead
            }
        )
        
        # Construct public URL
        # Format: https://{bucket}.s3.{region}.amazonaws.com/{key}
        region = os.getenv("AWS_REGION", "us-east-1")
        s3_url = f"https://{bucket_name}.s3.{region}.amazonaws.com/{s3_key}"
        
        print(f"Upload successful! URL: {s3_url}")
        return s3_url
        
    except ClientError as e:
        print(f"Error uploading to S3: {e}")
        raise
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise

