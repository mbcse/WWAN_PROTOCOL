/* eslint-disable @typescript-eslint/no-explicit-any */
import { PinataSDK } from "pinata-web3";

const pinata = new PinataSDK({
  pinataJwt: import.meta.env.VITE_PINATA_JWT as string,
  pinataGateway: import.meta.env.VITE_PINATA_GATEWAY as string,
});

export const uploadMetadata = async (metaData: any) => {
  const metadataBlob = new Blob([JSON.stringify(metaData)], {
    type: "application/json",
  });
  const metadataJson = new File([metadataBlob], "token_metadata.json", {
    type: "application/json",
  });

  try {
    const result = await pinata.upload.file(metadataJson);
    return `ipfs://ipfs/${result.IpfsHash}`;
  } catch (err: any) {
    console.log(err)
  }
};

export default pinata;