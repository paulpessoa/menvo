import { Loader } from '@googlemaps/js-api-loader';

const loader = new Loader({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  version: "weekly",
  libraries: ["places"]
});

export const googleMaps = {
  init: async () => {
    try {
      await loader.load();
      return window.google;
    } catch (error) {
      console.error('Error loading Google Maps:', error);
      throw error;
    }
  },

  getGeocode: async (address: string) => {
    const google = await googleMaps.init();
    const geocoder = new google.maps.Geocoder();
    
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK) {
          resolve(results[0]);
        } else {
          reject(status);
        }
      });
    });
  },

  getPlaceDetails: async (placeId: string) => {
    const google = await googleMaps.init();
    const placesService = new google.maps.places.PlacesService(document.createElement('div'));
    
    return new Promise((resolve, reject) => {
      placesService.getDetails(
        { placeId },
        (result, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            resolve(result);
          } else {
            reject(status);
          }
        }
      );
    });
  }
};
