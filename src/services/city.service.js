import { cityModal } from "../models/city.modal.js";
import {
  addCityValidation,
  editCityValidation,
  updatedStatusCityValidation,
  cityIdValidation,
} from "../shared/validation.js";
import { cityStatus } from "../shared/constants.js";
import HttpError from "../shared/htttp.error.js";

//////////////////  Add new city /////////////

export const addCityService = async (data) => {
  const { error } = addCityValidation(data);
  if (error) throw HttpError.badRequest(error.details[0].message);

  const saveCity = new cityModal({
    cityName: data.cityName,
    deliverCharges: data.deliverCharges,
  });

  const savedCity = await saveCity.save();
  return savedCity;
};

//////////////////////////////////////// Display displayCity  //////////////////////////

export const displayCity = async (request) => {
  const { page, per_page, search, status } = request;

  let query = {};

  if (status) {
    query.status = { $regex: status };
  }

  if (search) {
    query.cityName = { $regex: search };
  }

  const options = {
    page: page,
    limit: per_page,
    sort: {
      createdAt: -1,
    },
  };

  const city = await cityModal.paginate(query, options);
  return city;
};

//////////////////////////////////////// Display displayCity Website  //////////////////////////

export const displayCityWebSite = async () => {
  const city = await cityModal.find({ status: cityStatus.active }).sort({ createdAt: -1 });

  return city;
};

//////////////////////////////////////// City Display Id //////////////////////////
export const displayByIdCategory = async (id) => {
  const { error } = cityIdValidation(id);
  if (error) throw HttpError.badRequest(error.details[0].message);

  const city = await cityModal.findOne({ _id: id, status: cityStatus.active });
  return city;
};

//////////////////  Edit  City /////////////
export const editCityService = async (data) => {
  const { error } = editCityValidation(data);
  if (error) throw HttpError.badRequest(error.details[0].message);

  const cityObjExists = await cityModal.findById({
    _id: data.cityId,
  });
  if (!cityObjExists) throw HttpError.badRequest("Invalid City Id");

  const updatedCityObj = {
    cityName: data.cityName,
    deliverCharges: data.deliverCharges,
  };

  const updatedCity = await cityModal.updateOne(
    { _id: data.cityId },
    {
      $set: { ...updatedCityObj },
    }
  );

  return updatedCityObj;
};

//////////////////  Updated Status City /////////////

export const updatedStatusCityService = async (data) => {
  const { error } = updatedStatusCityValidation(data);
  if (error) throw HttpError.badRequest(error.details[0].message);

  const cityObjExists = await cityModal.findById({
    _id: data.cityId,
  });
  if (!cityObjExists) throw HttpError.badRequest("Invalid City Id");

  const isCheckStatus = Object.values(cityStatus).includes(data.status);
  if (!isCheckStatus) throw HttpError.badRequest("Invalid City Status");

  const updatedCityObj = {
    status: data.status,
  };

  const updatedCity = await cityModal.updateOne(
    { _id: data.cityId },
    {
      $set: { ...updatedCityObj },
    }
  );

  const designResponseMessage = `${cityObjExists.cityName} Status is ${data.status}`;

  return designResponseMessage;
};
