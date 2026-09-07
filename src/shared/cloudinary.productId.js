export const getCloudinaryProductId = async (previousImageUrl) => {
  const generateProductId = await previousImageUrl.split("/").pop().split(".")[0];

  return generateProductId;
};
