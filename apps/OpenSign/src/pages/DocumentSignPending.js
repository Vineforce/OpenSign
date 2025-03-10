import React, { useEffect, useState } from "react";
import Parse from "parse";
import axios from "axios";
import { useLocation } from "react-router";
import pad from "../assets/images/pad.svg";
import { useTranslation } from "react-i18next";
import Loader from "../primitives/Loader";
import Title from "../components/Title";
import Alert from "../primitives/Alert";
import Tooltip from "../primitives/Tooltip";
import ModalUi from "../primitives/ModalUi";
import { fetchUrl, getSignedUrl, replaceMailVaribles, mailTemplate, contractDocument, signatureTypes, handleSignatureType, getTenantDetails } from "../constant/Utils";



const heading = ["Name", "Description", "Owner", "Signers", "Approvers"];

const DocumentSignPending = () => {
  const [SignPending, setSignPending] = useState([]);
  const [isLoader, setIsLoader] = useState(false);
  const [isAlertMessage, setIsAlertMessage] = useState({ type: "success", msg: "" });
  const [isRejectSignModal, setIsRejectSignModal] = useState(false);

  const { t } = useTranslation();
  const location = useLocation();
  const isDashboard = location?.pathname === "/dashboard/35KBoSgoAK" ? true : false;

  //-----  Send Email to Signers started ---
  const [tenantMailTemplate, setTenantMailTemplate] = useState({ body: "", subject: "" });
  const [isUiLoading, setIsUiLoading] = useState(false);
  let isMailSent = false;
  const appName = 'Excis';
  //------ Send Email to Signers ended -----




  const [currentPage, setCurrentPage] = useState(1);
  const recordperPage = 10;
  const startIndex = (currentPage - 1) * recordperPage;
  const indexOfLastDoc = currentPage * recordperPage;
  const indexOfFirstDoc = indexOfLastDoc - recordperPage;
  const currentList = SignPending?.slice(indexOfFirstDoc, indexOfLastDoc);
  const currentUser = Parse.User.current();

  useEffect(() => {
    fetchDocumentsByApproverId(currentUser.id);
  }, []);

  const fetchDocumentsByApproverId = async (approverId) => {
    try {
      setIsLoader(true);
      const params = { approverId: approverId, documentSignApprovalFlag: 'ApprovalPending' }
      const documents = await Parse.Cloud.run('getDocumentsByApproverId', params);
      setSignPending(documents);
      setIsLoader(false);
    } catch (error) {
      console.error(error);
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
    const totalPages = Math.ceil(SignPending.length / recordperPage);
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

  const handleApproveDocumentSign = async (item, approveReject) => {
    try {
      const params = { approverUserId: currentUser.id, documentId: item.DocumentId, approvedorrejected: approveReject }
      const approveRejectStatus = await Parse.Cloud.run('approveRejectDocumentSign', params);
      if (approveRejectStatus) {
        if (approveReject === 'Approved') {
          // check if all approver(s) has approved then send email to Signers 
          hasAllApproverApproved(item.DocumentId)
            .then(() => {
              setIsAlertMessage({ type: "success", msg: isMailSent ? 'Document Sign Approved and Email Sent to Signer' : 'Document Sign Approved' });
              setTimeout(() => {
                setIsAlertMessage({ type: "danger", msg: '' });
                fetchDocumentsByApproverId(currentUser.id);
                isMailSent=false;
              }, 1500);
            })
            .catch((error) => {
              console.error('Error approving document:', error);
            });
        }
        else {
          setIsAlertMessage({ type: "success", msg: 'Document Sign Rejected' });
          setTimeout(() => {
            setIsAlertMessage({ type: "danger", msg: '' });
            fetchDocumentsByApproverId(currentUser.id);
          }, 1500);
        }
      }
      else {
        setIsAlertMessage({ type: "danger", msg: t("something-went-wrong-mssg") });
        setIsLoader(false);
      }
    } catch (error) {
      console.error(error); // Handle any errors
    }
  };

  const handleRejectDocumentClick = () => {
    setIsRejectSignModal(true)
  };

  const handleClose = () => {
    setIsRejectSignModal(false);
  };

  const hasAllApproverApproved = async (docId) => {
    try {
      const params = { documentId: docId }
      const allApproverApprovedStatus = await Parse.Cloud.run('hasAllApproverApproved', params);
      if (allApproverApprovedStatus) {
        // write the code to handle email and further process
        let dataForSendingEmail = await setEmailData(docId);
        await sendEmailToSigners(docId, dataForSendingEmail);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const setEmailData = async (documentId) => {
    const data = {};
    const tenantSignTypes = await fetchTenantDetails();
    const documentData = await contractDocument(documentId);
    const userSignatureType = documentData[0]?.ExtUserPtr?.SignatureType || signatureTypes;
    const docSignTypes = documentData?.[0]?.SignatureType || userSignatureType;
    const updatedSignatureType = await handleSignatureType(tenantSignTypes, docSignTypes);
    data.signatureType = updatedSignatureType;

    const updatedPdfDetails = [...documentData];
    updatedPdfDetails[0].SignatureType = updatedSignatureType;
    data.pdfDetails = updatedPdfDetails;


    const signersArr = documentData[0].Signers;
    const placeholder = documentData[0].Placeholders;
    const updatedSigners = signersArr.map((x, index) => ({
      ...x,
      Id: placeholder[index]?.Id,
      Role: placeholder[index]?.Role,
      blockColor: placeholder[index]?.blockColor
    }));
    data.signers = updatedSigners;

    data.extUserId = documentData[0]?.ExtUserPtr?.objectId;
    return data;
  };



  const sendEmailToSigners = async (documentId, dataToSendEmail) => {
    const requestBody = `<p>Hi {{receiver_name}},</p><br><p>We hope this email finds you well. {{sender_name}}&nbsp;has requested you to review and sign&nbsp;{{document_title}}.</p><p>Your signature is crucial to proceed with the next steps as it signifies your agreement and authorization.</p><br><p>{{signing_url}}</p><br><p>If you have any questions or need further clarification regarding the document or the signing process,  please contact the sender.</p><br><p>Thanks</p><p> Team ${appName}</p><br>`;
    const requestSubject = `{{sender_name}} has requested you to sign {{document_title}}`;
    let isCustomize = true; // set it false if you do not want the custom email template

    let htmlReqBody;
    setIsUiLoading(true);
    let sendMail;
    const pdfDetails = dataToSendEmail.pdfDetails;

    const expireDate = pdfDetails?.[0].ExpiryDate.iso;
    const newDate = new Date(expireDate);
    const localExpireDate = newDate.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    let senderEmail = pdfDetails?.[0]?.ExtUserPtr?.Email;
    let senderPhone = pdfDetails?.[0]?.ExtUserPtr?.Phone;
    const signersdata = dataToSendEmail.signers;
    let signerMail = signersdata.slice();

    if (pdfDetails?.[0]?.SendinOrder && pdfDetails?.[0]?.SendinOrder === true) {
      signerMail.splice(1);
    }

    for (let i = 0; i < signerMail.length; i++) {
      try {
        let url = `${localStorage.getItem("baseUrl")}functions/sendmailv3`;
        const headers = {
          "Content-Type": "application/json",
          "X-Parse-Application-Id": localStorage.getItem("parseAppId"),
          sessionToken: localStorage.getItem("accesstoken")
        };
        const objectId = signerMail[i].objectId;
        const hostUrl = window.location.origin;
        //encode this url value `${pdfDetails?.[0].objectId}/${signerMail[i].Email}/${objectId}` to base64 using `btoa` function
        const encodeBase64 = btoa(
          `${pdfDetails?.[0].objectId}/${signerMail[i].Email}/${objectId}`
        );
        let signPdf = `${hostUrl}/login/${encodeBase64}`;
        const orgName = pdfDetails[0]?.ExtUserPtr.Company
          ? pdfDetails[0].ExtUserPtr.Company
          : "";
        const senderName =
          pdfDetails?.[0].ExtUserPtr.Name;
        const documentName = `${pdfDetails?.[0].Name}`;
        let replaceVar;

        if (requestBody && requestSubject && isCustomize) {
          const replacedRequestBody = requestBody.replace(/"/g, "'");
          htmlReqBody =
            "<html><head><meta http-equiv='Content-Type' content='text/html; charset=UTF-8' /></head><body>" +
            replacedRequestBody +
            "</body> </html>";

          const variables = {
            document_title: documentName,
            sender_name: senderName,
            sender_mail: senderEmail,
            sender_phone: senderPhone || "",
            receiver_name: signerMail[i]?.Name || "",
            receiver_email: signerMail[i].Email,
            receiver_phone: signerMail[i]?.Phone || "",
            expiry_date: localExpireDate,
            company_name: orgName,
            signing_url: `<a href=${signPdf} target=_blank>Sign here</a>`
          };
          replaceVar = replaceMailVaribles(
            requestSubject,
            htmlReqBody,
            variables
          );
        } else if (tenantMailTemplate?.body && tenantMailTemplate?.subject) {
          const mailBody = tenantMailTemplate?.body;
          const mailSubject = tenantMailTemplate?.subject;
          const replacedRequestBody = mailBody.replace(/"/g, "'");
          const htmlReqBody =
            "<html><head><meta http-equiv='Content-Type' content='text/html; charset=UTF-8' /></head><body>" +
            replacedRequestBody +
            "</body> </html>";
          const variables = {
            document_title: documentName,
            sender_name: senderName,
            sender_mail: senderEmail,
            sender_phone: senderPhone || "",
            receiver_name: signerMail[i]?.Name || "",
            receiver_email: signerMail[i].Email,
            receiver_phone: signerMail[i]?.Phone || "",
            expiry_date: localExpireDate,
            company_name: orgName,
            signing_url: `<a href=${signPdf} target=_blank>Sign here</a>`
          };
          replaceVar = replaceMailVaribles(mailSubject, htmlReqBody, variables);
        }
        const mailparam = {
          senderName: senderName,
          senderMail: senderEmail,
          title: documentName,
          organization: orgName,
          localExpireDate: localExpireDate,
          sigingUrl: signPdf
        };
        let params = {
          extUserId: dataToSendEmail.extUserId,
          recipient: signerMail[i].Email,
          subject: replaceVar?.subject
            ? replaceVar?.subject
            : mailTemplate(mailparam).subject,
          replyto: senderEmail,
          from:
            senderEmail,
          html: replaceVar?.body
            ? replaceVar?.body
            : mailTemplate(mailparam).body
        };
        sendMail = await axios.post(url, params, { headers: headers });
      } catch (error) {
        console.log("error", error);
      }
    }
    if (sendMail?.data?.result?.status === "success") {
      try {
        let data;
        if (requestBody && requestSubject && isCustomize) {
          data = {
            RequestBody: htmlReqBody,
            RequestSubject: requestSubject,
            SendMail: true
          };
        }
        else if (tenantMailTemplate?.body && tenantMailTemplate?.subject) {
          data = {
            RequestBody: tenantMailTemplate?.body,
            RequestSubject: tenantMailTemplate?.subject,
            SendMail: true
          };
        }
        else {
          data = { SendMail: true };
        }
        try {
          await axios.put(
            `${localStorage.getItem(
              "baseUrl"
            )}classes/contracts_Document/${documentId}`,
            data,
            {
              headers: {
                "Content-Type": "application/json",
                "X-Parse-Application-Id": localStorage.getItem("parseAppId"),
                "X-Parse-Session-Token": localStorage.getItem("accesstoken")
              }
            }
          );
        } catch (err) {
          console.log("axois err ", err);
        }
      } catch (e) {
        console.log("error", e);
      }
      isMailSent = true;
      setIsUiLoading(false);
    } else if (sendMail?.data?.result?.status === "quota-reached") {
      setIsUiLoading(false);
      setIsAlertMessage({ type: "danger", msg: 'Email Quota Reached' });
      setTimeout(() => {
        setIsAlertMessage({ type: "danger", msg: '' });
        fetchDocumentsByApproverId(currentUser.id);
      }, 1500);
    } else {
      setIsUiLoading(false);
      setIsAlertMessage({ type: "danger", msg: 'Email Sending failed' });
      setTimeout(() => {
        setIsAlertMessage({ type: "danger", msg: '' });
        fetchDocumentsByApproverId(currentUser.id);
      }, 1500);
    }
  };

  const fetchTenantDetails = async () => {
    const user = JSON.parse(
      localStorage.getItem(
        `Parse/${localStorage.getItem("parseAppId")}/currentUser`
      )
    );
    if (user) {
      try {
        const tenantDetails = await getTenantDetails(user?.objectId);
        if (tenantDetails && tenantDetails === "user does not exist!") {
          alert(t("user-not-exist"));
        } else if (tenantDetails) {
          const signatureType = tenantDetails?.SignatureType || [];
          const filterSignTypes = signatureType?.filter(
            (x) => x.enabled === true
          );
          if (tenantDetails?.RequestBody) {
            setTenantMailTemplate({
              body: tenantDetails?.RequestBody,
              subject: tenantDetails?.RequestSubject
            });
          }
          return filterSignTypes;
        }
      } catch (e) {
        alert(t("user-not-exist"));
      }
    } else {
      alert(t("user-not-exist"));
    }
  };


  return (
    <div className="relative">
      <Title title="Document Approval Pending" />
      {isLoader && (
        <div className="absolute w-full h-[300px] md:h-[400px] flex justify-center items-center z-30 rounded-box">
          <Loader />
        </div>
      )}
      {isUiLoading && (
        <div className="absolute h-[100vh] w-full flex flex-col justify-center items-center z-[999] bg-[#e6f2f2] bg-opacity-80">
          <Loader />
          <span className="text-[13px] text-base-content">
            {t("loading-mssg")}
          </span>
        </div>
      )}
      {!isLoader && (
        <div className="p-2 w-full bg-base-100 text-base-content op-card shadow-lg">
          {isAlertMessage.msg && (
            <Alert type={isAlertMessage.type}>{isAlertMessage.msg}</Alert>
          )}
          <div className="flex flex-row items-center justify-between my-2 mx-3 text-[20px] md:text-[23px]">
            <div className="font-light">
              {"Document Approval Pending"}{" "}
              <span className="text-xs md:text-[13px] font-normal">
                <Tooltip message="List of document(s) that need your approval and then the Signers can start signing the document. You can approve or reject the document" />
              </span>
            </div>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="op-table border-collapse w-full">
              <thead className="text-[14px]">
                <tr className="border-y-[1px]">
                  {heading?.map((itemHeader, index) => (
                    <th key={index} className="px-4 py-2">
                      {t(`report-heading.${itemHeader}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[12px]">
                {SignPending?.length > 0 && (
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
                          {item?.ownerUserName} (
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
                        <td className="px-2 py-2">
                          <div className="text-base-content min-w-max flex flex-row gap-x-2 gap-y-1 justify-start items-center">
                            <div role="button" title="Approve" onClick={() => handleApproveDocumentSign(item, 'Approved')}
                              className="op-btn-primary op-btn op-btn-sm mr-1">
                              <i className="fas fa-check"></i>
                            </div>
                            <div role="button" title="Reject"
                              onClick={() => handleRejectDocumentClick()}
                              className="op-btn-secondary op-btn op-btn-sm mr-1">
                              <i className="fas fa-ban"></i>
                            </div>
                          </div>
                          {isRejectSignModal && (
                            <ModalUi
                              isOpen
                              title='Reject Document'
                              handleClose={() => handleClose()}
                            >
                              <div className="m-[20px]">
                                <div className="text-lg font-normal text-black">
                                  Are you sure you want to reject document {item.Name}?
                                </div>
                                <hr className="bg-[#ccc] mt-4 " />
                                <div className="flex items-center mt-3 gap-2 text-white">
                                  <button
                                    onClick={() => handleApproveDocumentSign(item, 'Rejected')}
                                    className="op-btn op-btn-primary"
                                  >
                                    {t("yes")}
                                  </button>
                                  <button
                                    onClick={() => handleClose()}
                                    className="op-btn op-btn-secondary"
                                  >
                                    {t("no")}
                                  </button>
                                </div>
                              </div>
                            </ModalUi>
                          )}
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
              {SignPending.length > recordperPage && (
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
              {SignPending.length > recordperPage && (
                <button
                  onClick={() => paginateFront()}
                  className="op-join-item op-btn op-btn-sm"
                >
                  {t("next")}
                </button>
              )}
            </div>
          </div>
          {SignPending?.length <= 0 && (
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

export default DocumentSignPending;
