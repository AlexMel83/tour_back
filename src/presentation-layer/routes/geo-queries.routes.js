import url from 'url';

export default function (app) {
  app.get('/geosearch/:query', async (req, res) => {
    try {
      const queryParams = url.parse(req.url, true).query;

      if (
        !queryParams.proximity ||
        queryParams.proximity === 'undefined,undefined'
      ) {
        delete queryParams.proximity;
      }

      const params = new URLSearchParams({
        access_token: process.env.APIKEY_MAPBOX,
        ...queryParams,
      });

      const query = req.params.query;
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?${params}`,
      );

      if (!response.ok) {
        return res
          .status(response.status)
          .json({ message: 'Error fetching data' });
      }

      const data = await response.json();

      if (!data.features || data.features.length === 0) {
        return res.status(404).json({ message: 'Not found' });
      }

      // Обработка каждого элемента features
      data.features.forEach((item) => {
        item.city = null;
        item.state = null;

        if (Array.isArray(item.context)) {
          item.context.forEach((type) => {
            if (type.id.includes('place')) {
              item.city = type.text;
            }
            if (type.id.includes('region')) {
              item.state = type.text;
            }
          });
        }
      });

      return res.status(200).json(data);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  });
}
