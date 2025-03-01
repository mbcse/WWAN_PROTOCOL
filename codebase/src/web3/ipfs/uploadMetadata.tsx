/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import pinata from '@/web3/services/ipfs/pinata'; // Adjust the path as necessary
import { Button } from '@/components/ui/button';

interface MetaDataUploaderType {
  metaData: any
}

const MetaDataUploader = ({
  metaData,
}: MetaDataUploaderType) => {
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleUpload = async () => {
    setUploading(true);
    setError(null);
    setSuccess(null);

    const metadataBlob = new Blob([JSON.stringify(metaData)], {
      type: "application/json",
    });
    const metadataJson = new File([metadataBlob], "token_metadata.json", {
      type: "application/json",
    });

    try {
      const result = await pinata.upload.file(metadataJson);
      setSuccess(`File uploaded successfully: ${result.IpfsHash}`);
    } catch (err: any) {
      setError(`Error uploading file: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Button onClick={handleUpload} disabled={uploading}>
        {uploading ? 'Uploading metadata...' : 'Upload Metadata'}
      </Button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  );
};

export default MetaDataUploader;