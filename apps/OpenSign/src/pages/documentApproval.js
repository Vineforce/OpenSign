import React, { useState, useEffect } from "react";
import GetDashboard from "../components/dashboard/GetDashboard";
import { useNavigate } from "react-router";
import Title from "../components/Title";
import { useDispatch } from "react-redux";
import { saveTourSteps } from "../redux/reducers/TourStepsReducer";
import documentApprovalJson from "../json/documentApprovalJson";
import Loader from "../primitives/Loader";
import { useTranslation } from "react-i18next";

const DocumentApproval = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [documentApproval, setDocumentApproval] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localStorage.getItem("accesstoken")) {
      const documentApprovalId = "5Jkcdp593L";
      getDocumentApproval(documentApprovalId);
    } else {
      navigate("/", { replace: true, state: { from: "" } });
    }
    // eslint-disable-next-line
  }, []);

  const getDocumentApproval = (id) => {
    try {
      const documentApproval = documentApprovalJson.find((x) => x.id === id);
      setDocumentApproval(documentApproval);
      
      const dashboardTour = documentApproval.columns
        .filter((col) => col.widget.data?.tourSection)
        .map((col) => ({
          selector: `[data-tut=${col.widget.data.tourSection}]`,
          content: t(`tour-mssg.${col.widget.label}`),
          position: "top"
        }));
      
      dispatch(saveTourSteps(dashboardTour));
      setLoading(false);
    } catch (e) {
      console.error("Problem", e);
      setLoading(false);
    }
  }; 

  return (
    <React.Fragment>
      <Title title="Document Approval" /> {/* Fixed typo */}
      {loading ? (
        <div className="h-[300px] w-full bg-white flex justify-center items-center rounded-md">
          <Loader />
        </div>
      ) : (
        <GetDashboard dashboard={documentApproval} />
      )}
    </React.Fragment>
  );
};

export default DocumentApproval;