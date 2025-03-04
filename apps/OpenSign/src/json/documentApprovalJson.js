const documentApprovalJson = [
    {
      id: "5Jkcdp593L",
      columns: [
        {
          colsize: "col-span-12 md:col-span-6 lg:col-span-6",
          widget: {
            type: "report",
            reportId: "9OpTyuJFUH",
            label: "Documents for approval",
            data: {
              tourSection: "tourreport1"
            }
          }
        },
        {
          colsize: "col-span-12 md:col-span-6 lg:col-span-6",
          widget: {
            type: "report",
            reportId: "6TOPqwuYIv",
            label: "Approved Documents",
            data: {
              tourSection: "tourreport2"
            }
          }
        },
        {
          colsize: "col-span-12 md:col-span-12 lg:col-span-12",
          widget: {
            type: "report",
            reportId: "5YuIoQW91V",
            label: "Not Approved",
            data: {
              tourSection: "tourreport3"
            }
          }
        }
      ]
    }
  ];
  export default documentApprovalJson;
  