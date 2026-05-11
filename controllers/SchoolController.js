const db = require("../config/db");


// Add School API
const addSchool = async (req, res) => {
  try {
    const { name, address, latitude, longitude } = req.body;

    if (
      !name ||
      !address ||
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number"
    ) {
      return res.status(400).json({
        success: false,
        message: "Latitude and Longitude must be numbers",
      });
    }

    const query = `
      INSERT INTO schools (name, address, latitude, longitude)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      name,
      address,
      latitude,
      longitude,
    ]);

    res.status(201).json({
      success: true,
      message: "School added successfully",
      schoolId: result.insertId,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


// Distance Formula
const calculateDistance = (
  lat1,
  lon1,
  lat2,
  lon2
) => {
  const toRad = (value) => (value * Math.PI) / 180;

  const R = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};


// List Schools API
const listSchools = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and Longitude are required",
      });
    }

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);

    if (isNaN(userLat) || isNaN(userLon)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates",
      });
    }

    const [schools] = await db.execute(
      "SELECT * FROM schools"
    );

    const sortedSchools = schools.map((school) => {
      const distance = calculateDistance(
        userLat,
        userLon,
        school.latitude,
        school.longitude
      );

      return {
        ...school,
        distance: distance.toFixed(2) + " km",
      };
    });

    sortedSchools.sort(
      (a, b) =>
        parseFloat(a.distance) - parseFloat(b.distance)
    );

    res.status(200).json({
      success: true,
      count: sortedSchools.length,
      schools: sortedSchools,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  addSchool,
  listSchools,
};