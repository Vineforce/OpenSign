import React, { useState, useEffect } from "react";
import AsyncSelect from "react-select/async";
import Parse from "parse";
import Tooltip from "../../../primitives/Tooltip";
import { useTranslation } from "react-i18next";

function arrayMove(array, from, to) {
  array = array.slice();
  array.splice(to < 0 ? array.length + to : to, 0, array.splice(from, 1)[0]);
  return array;
}


/**
 * react-sortable-hoc is depcreated not usable from react 18.x.x
 *  need to replace it with @dnd-kit
 * code changes required
 */

const ApproversInput = (props) => {
  const { t } = useTranslation();
  const [state, setState] = useState(undefined);
  const [selected, setSelected] = useState([]);
  //const [isModal, setIsModel] = useState(false);
  //const [modalIsOpen, setModalIsOpen] = useState(false);

  const onChange = (selectedOptions) => {
    if (selectedOptions && selectedOptions?.length > 0) {
      const trimEmail = selectedOptions.map((item) => ({
        ...item,
        label: item?.label?.split("<")?.shift()
      }));
      setSelected(trimEmail);
    } else {
      setSelected(selectedOptions);
    }
  };

  const onSortEnd = ({ oldIndex, newIndex }) => {
    const newValue = arrayMove(selected, oldIndex, newIndex);
    setSelected(newValue);
  };

  useEffect(() => {
    if (props.isReset && props.isReset === true) {
      setSelected([]);
    }
  }, [props.isReset]);

  useEffect(() => {
    if (selected && selected.length) {
      let newData = [];
      selected.forEach((x) => {
        if (props?.isCaptureAllData) {
          newData.push(x);
        } else {
          newData.push(x.value);
        }
      });
      if (props.onChange) {
        props.onChange(newData);
      }
    }

    // eslint-disable-next-line
  }, [selected]);

 
  const loadOptions = async (inputValue) => {
    try {
      const params = { search: inputValue };
      const contactRes = await Parse.Cloud.run("getApprovers", params);
      //---console.log('contactRes===>',contactRes);
      if (contactRes) {
        const res = JSON.parse(JSON.stringify(contactRes));
        //compareArrays is a function where compare between two array (total ApproversList and dcument Approver list)
        //and filter Approvers from total Approver's list which already present in document's Approver list
        const compareArrays = (res, approverObj) => {
          return res.filter(
            (item1) =>
              !approverObj.find((item2) => item2.objectId === item1.objectId)
          );
        };
        //get update approvers's List if approversData is present
        const updateApproversList =
          props?.approversData && compareArrays(res, props?.approversData);

        const result = updateApproversList ? updateApproversList : res;


        
        setState(result);
        return await result.map((item) => ({
          label: item.Name + "<" + item.Email + ">",
          value: item.objectId,
          email: item.Email,
          isChecked: true
        }));
      }
    } catch (error) {
      console.log("err", error);
    }
  };
  return (
    <div className="text-xs mt-2 ">
      <label className="block relative">
        {props.label ? props.label : "Approvers"}
        {props.required && <span className="text-red-500 text-[13px]">*</span>}
        <span
          className={`z-[${props?.helptextZindex ? props.helptextZindex : 30}] absolute ml-1 text-xs`}
        >
          <Tooltip
            id={`${props.label ? props.label : "signers"}-tooltip`}
            message={props.tooltipMessageDetails || "Start typing a contact's name to see suggested approvers from your saved contacts, or add a new one. Each approver will receive an email asking them to approve the document. Once all approvers have given their approval, the signer can begin signing the document"}
           />
        </span>
      </label>
      <div className="flex gap-x-[5px]">
        <div className="w-full z-39">
          <AsyncSelect
            onSortEnd={onSortEnd}
            distance={4}
            isMulti
            cacheOptions
            defaultOptions
            options={state || []}
            value={selected}
            onChange={onChange}
            closeMenuOnSelect={false}
            required={props.required}
            loadingMessage={() => t("loading")}
            noOptionsMessage={() => t("contact-not-found")}
            loadOptions={loadOptions}
            unstyled
            classNames={{
              control: () =>
                "op-input op-input-bordered op-input-sm focus:outline-none hover:border-base-content w-full h-full text-[11px]",
              valueContainer: () =>
                "flex flex-row gap-x-[2px] gap-y-[2px] md:gap-y-0 w-full my-[2px]",
              multiValue: () => "op-badge op-badge-primary h-full text-[11px]",
              multiValueLabel: () => "mb-[2px]",
              menu: () =>
                "mt-1 shadow-md rounded-lg bg-base-200 text-base-content",
              menuList: () => "shadow-md rounded-lg overflow-hidden",
              option: () =>
                "bg-base-200 text-base-content rounded-lg m-1 hover:bg-base-300 p-2",
              noOptionsMessage: () => "p-2 bg-base-200 rounded-lg m-1 p-2"
            }}
          />
        </div>
        <div className="cursor-pointer op-input op-input-bordered focus:outline-none hover:border-base-content max-h-[38px] min-w-[48px] flex justify-center items-center">
        <span
          className={`z-[${props?.helptextZindex ? props.helptextZindex : 30}] absolute mt-2 text-xs`}
        >
          <Tooltip
            id={`${props.label ? props.label : "signers"}-tooltip`}
            message={props.tooltipMessageInfo || "Go to Settings, then click on 'Users' and click on 'Add User' to add a new approver."}
          />
        </span>
        </div>
      </div>
    </div>
  );
};

export default ApproversInput;
