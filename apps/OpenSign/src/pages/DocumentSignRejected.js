import React, { useEffect, useState } from "react";
import Parse from "parse";
import { useLocation } from "react-router";
import pad from "../assets/images/pad.svg";
import { useTranslation } from "react-i18next";
import Loader from "../primitives/Loader";
import Title from "../components/Title";
import Alert from "../primitives/Alert";
import Tooltip from "../primitives/Tooltip";
import {fetchUrl, getSignedUrl} from "../constant/Utils";


const heading = ["Name", "Description", "Owner", "Signers", "Approvers"];

const DocumentSignRejected = () => {
  const [SignRejected, setSignPending] = useState([]);
  const [isLoader, setIsLoader] = useState(false);
  const [isAlert, setIsAlert] = useState(false);
  const [isAlertMessage, setIsAlertMessage] = useState({ type: "success", msg: "" });

  const { t } = useTranslation();
  const location = useLocation();
  const isDashboard = location?.pathname === "/dashboard/35KBoSgoAK" ? true : false;


  const [currentPage, setCurrentPage] = useState(1);
  const recordperPage = 10;
  const startIndex = (currentPage - 1) * recordperPage;
  const indexOfLastDoc = currentPage * recordperPage;
  const indexOfFirstDoc = indexOfLastDoc - recordperPage;
  const currentList = SignRejected?.slice(indexOfFirstDoc, indexOfLastDoc);
  const currentUser = Parse.User.current();

  useEffect(() => {    
    fetchDocumentsByApproverId(currentUser.id);
  }, []);

  const fetchDocumentsByApproverId = async (approverId) => {
    try {
      setIsLoader(true);
      const params = { approverId: approverId, documentSignApprovalFlag: 'Rejected' }
      const documents = await Parse.Cloud.run('getDocumentsByApproverId', params);
      setSignPending(documents);
      setIsLoader(false);
    } catch (error) {
      console.error(error); 
      setIsAlert(true);
      setIsAlertMessage({ type: "danger", msg: t("something-went-wrong-mssg") });
      setIsLoader(false);
    }
  };


  const paginateFront = () => {
    const lastValue = pageNumbers?.[pageNumbers?.length - 1];
    if (currentPage < lastValue) {
      setCurrentPage(currentPage + 1);
    }
  };

  const paginateBack = () => {
    if (startIndex > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const getPaginationRange = () => {
    const totalPageNumbers = 7; // Adjust this value to show more/less page numbers
    const pages = [];
    const totalPages = Math.ceil(SignRejected.length / recordperPage);
    if (totalPages <= totalPageNumbers) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const leftSiblingIndex = Math.max(currentPage - 1, 1);
      const rightSiblingIndex = Math.min(currentPage + 1, totalPages);

      const showLeftDots = leftSiblingIndex > 2;
      const showRightDots = rightSiblingIndex < totalPages - 2;

      const firstPageIndex = 1;
      const lastPageIndex = totalPages;

      if (!showLeftDots && showRightDots) {
        let leftItemCount = 3;
        let leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);

        pages.push(...leftRange);
        pages.push("...");
        pages.push(totalPages);
      } else if (showLeftDots && !showRightDots) {
        let rightItemCount = 3;
        let rightRange = Array.from(
          { length: rightItemCount },
          (_, i) => totalPages - rightItemCount + i + 1
        );

        pages.push(firstPageIndex);
        pages.push("...");
        pages.push(...rightRange);
      } else if (showLeftDots && showRightDots) {
        let middleRange = Array.from(
          { length: 3 },
          (_, i) => leftSiblingIndex + i
        );

        pages.push(firstPageIndex);
        pages.push("...");
        pages.push(...middleRange);
        pages.push("...");
        pages.push(lastPageIndex);
      }
    }
    return pages;
  };
  const pageNumbers = getPaginationRange();
 
  const handleViewDocument = async (item) => {
    const url = item?.SignedUrl || item?.FileUrl || "";
    const pdfName = item?.Name?.length > 100
      ? item?.OriginalFileName?.slice(0, 100)
      : item?.OriginalFileName || "Document";
  
    const templateId = '';
    const docId = item.objectId;
  
    if (url) {
      try {
        const signedUrl = await getSignedUrl(
          url,
          docId,
          templateId
        );
  
        // Create an anchor element to open the file in a new tab
        const link = document.createElement('a');
        link.href = signedUrl; // Use the signed URL
        link.target = '_blank'; // Open in a new tab
        link.download = pdfName; // Optionally set the filename for downloading
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link); // Clean up after opening the link
  
      } catch (err) {
        console.log("err in getsignedurl", err);
        alert(t("something-went-wrong-mssg"));
      }
    }
  };
  const handleDownloadDocument = async (item) => {
     const url = item?.SignedUrl || item?.FileUrl || "";
     const pdfName = item?.Name?.length > 100
       ? item?.OriginalFileName?.slice(0, 100)
       : item?.OriginalFileName || "Document";
 
     const templateId = '';
     const docId = item.objectId;
     if (url) {
       try {
 
         const signedUrl = await getSignedUrl(
           url,
           docId,
           templateId
         );
         await fetchUrl(signedUrl, pdfName);
 
       } catch (err) {
         console.log("err in getsignedurl", err);
         alert(t("something-went-wrong-mssg"));
       }
     }
   };

  return (
    <div className="relative">
      <Title title="Document Rejected" />
      {isLoader && (
        <div className="absolute w-full h-[300px] md:h-[400px] flex justify-center items-center z-30 rounded-box">
          <Loader />
        </div>
      )}
      {!isLoader && (
        <div className="p-2 w-full bg-base-100 text-base-content op-card shadow-lg">
          {isAlertMessage.msg && (
            <Alert type={isAlertMessage.type}>{isAlertMessage.msg}</Alert>
          )}
          <div className="flex flex-row items-center justify-between my-2 mx-3 text-[20px] md:text-[23px]">
            <div className="font-light">
              {"Document Rejected"}{" "}
              <span className="text-xs md:text-[13px] font-normal">
                <Tooltip message="List of document(s) that you have rejected." />
              </span>
            </div>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="op-table border-collapse w-full">
              <thead className="text-[14px]">
                <tr className="border-y-[1px]">
                  {heading?.map((item, index) => (
                    <th key={index} className="px-4 py-2">
                      {t(`report-heading.${item}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[12px]">
                {SignRejected?.length > 0 && (
                  <>
                    {currentList.map((item, index) => (
                      <tr className="border-y-[1px]" key={index}>
                        <td className="px-4 py-2 font-semibold">
                          {item?.Name}{" "}
                        </td>
                        <td className="px-4 py-2 ">
                          {item?.Description || "-"}
                        </td>
                        <td className="px-4 py-2 ">     
                          {item?.ownerUserName } (
                          {item?.ownerUserEmail})
                        </td>
                        <td className="px-4 py-2">
                          {item?.SignersEmail?.map((email, index) => (
                            <div key={index}>{email}</div>
                          ))}
                        </td>
                        <td className="px-4 py-2">
                          {item?.ApproversEmail?.map((email, index) => (
                            <div key={index}>{email}</div>
                          ))}
                        </td>
                        <td>
                          <a onClick={() => handleViewDocument(item)} title="View" className="btn btn-link btn-sm">
                            <i className="fa fa-eye" style={{ color: '#002864' }}></i>
                          </a>
                          <a onClick={() => handleDownloadDocument(item)} title="Download" className="btn btn-link btn-sm">
                            <i className="fa fa-download" style={{ color: '#002864' }}></i>
                          </a>
                        </td>                        
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-row  justify-between items-center text-xs font-medium">
            <div className="op-join flex flex-wrap items-center p-2">
              {SignRejected.length > recordperPage && (
                <button
                  onClick={() => paginateBack()}
                  className="op-join-item op-btn op-btn-sm"
                >
                  {t("prev")}
                </button>
              )}
              {pageNumbers.map((x, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(x)}
                  disabled={x === "..."}
                  className={`${x === currentPage ? "op-btn-active" : ""
                    } op-join-item op-btn op-btn-sm`}
                >
                  {x}
                </button>
              ))}
              {SignRejected.length > recordperPage && (
                <button
                  onClick={() => paginateFront()}
                  className="op-join-item op-btn op-btn-sm"
                >
                  {t("next")}
                </button>
              )}
            </div>
          </div>
          {SignRejected?.length <= 0 && (
            <div
              className={`${isDashboard ? "h-[317px]" : ""
                } flex flex-col items-center justify-center w-ful bg-base-100 text-base-content rounded-xl py-4`}
            >
              <div className="w-[60px] h-[60px] overflow-hidden">
                <img
                  className="w-full h-full object-contain"
                  src={pad}
                  alt="img"
                />
              </div>
              <div className="text-sm font-semibold">
                {t("no-data-avaliable")}
              </div>
            </div>
          )}
        </div>
      )}  
    </div>
  );
};

export default DocumentSignRejected;
