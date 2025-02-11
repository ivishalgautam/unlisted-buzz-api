"use strict";
import table from "../../db/models.js";

const getReports = async (req, res) => {
  try {
    const totalShares = await table.ShareModel.countShares();
    const totalIPOs = await table.ShareModel.countIPOs();
    const todaySectors = await table.SectorModel.countSectors();

    const report = {
      total_shares: totalShares,
      total_ipos: totalIPOs,
      total_sectors: todaySectors,
    };

    res.send({
      status: true,
      data: report,
    });
  } catch (error) {
    throw error;
  }
};

export default {
  getReports: getReports,
};
