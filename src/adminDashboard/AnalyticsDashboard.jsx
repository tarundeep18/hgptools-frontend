import React from "react";
import DevicesChart from "../DashboardRoutes/Charts/DeviceChart";
import CountryTrafficChart from "../DashboardRoutes/Charts/CountrtyChart";
import PageAnalyticsDashboard from "../DashboardRoutes/Charts/PagesChart";

const AnalyticsDashboard = () => {
  return (
    <>
      <CountryTrafficChart />
      {/* <DevicesChart /> */}
      {/* <PageAnalyticsDashboard/> */}
    </>
  );
};

export default AnalyticsDashboard;
