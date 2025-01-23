import React, { useContext, useEffect, useState } from "react";
import Modal from "./Modal";
import { Button, Checkbox, IconButton, MenuItem, Select } from "@mui/material";
import { teal } from "@mui/material/colors";
import {
  CaretDown,
  CaretUp,
  CircleNotch,
  FloppyDisk,
  Notebook,
  TrashSimple,
  X,
} from "@phosphor-icons/react";
import Android12Switch from "./Andriod12Switch";
import { UserContext } from "@/providers/MyContext";
import { configureAxios } from "@/utils/axiosInstance";
import communityData from "@/server/utils/communityData";
import { toast } from "react-toastify";

function AutoMod({
  open,
  onClose = () => {},
  filters = {
    presets: {},
    generatedFilters: {},
  },
  getCommunity,
}) {
  const { setUser } = useContext(UserContext);
  const axiosInstance = configureAxios(setUser);

  const [filtersSettings, setFiltersSettings] = useState(filters);
  const [isExpandBlockSpam, setIsExpandBlockSpam] = useState(false);
  const [customFilterTitle, setCustomFilterTitle] = useState("");
  const [isEvaluatingFilter, setIsEvaluatingFilter] = useState(false);
  const [filterEvaluationResult, setFilterElavationResult] = useState({});
  const [isTimeoutMember, setIsTimeoutMember] = useState(false);
  const [timeoutConfigFilterName, setTimeoutConfigFilterName] = useState("");
  const [isSavingSettings, setIsSavingSetting] = useState(false);

  useEffect(() => {
    if (open) {
      const clonedFilters = JSON.parse(JSON.stringify(filters)); // Remove references from deeply nested objects
      setFiltersSettings(clonedFilters);
    }
  }, [open]);

  useEffect(() => {
    if (customFilterTitle.length) {
      const eveluateCustomFilter = async () => {
        setIsEvaluatingFilter(true);
        try {
          const res = await axiosInstance.get(
            `/communities/generated-filters?filterTitle=${customFilterTitle}`
          );

          setFilterElavationResult(res.data);
        } catch {
        } finally {
          setIsEvaluatingFilter(false);
        }
      };
      const timer = setTimeout(eveluateCustomFilter, 1500);
      return () => {
        clearTimeout(timer);
      };
    } else {
      setFilterElavationResult({});
    }
  }, [customFilterTitle]);

  const tooglePresets = (e) => {
    const updatedFiltersSetting = { ...filtersSettings };
    updatedFiltersSetting.presets.enabled = e.target.checked;
    setFiltersSettings(updatedFiltersSetting);
  };

  const toogleGeneratedFilters = (e) => {
    const updatedFiltersSetting = { ...filtersSettings };
    updatedFiltersSetting.generatedFilters.enabled = e.target.checked;
    setFiltersSettings(updatedFiltersSetting);
  };

  const toogleEnableFilter = (e, filterName) => {
    const updatedFiltersSetting = { ...filtersSettings };
    const options = updatedFiltersSetting.presets.options;
    const filterIndex = options.findIndex(
      (filter) => filter.name === filterName
    );

    if (filterIndex !== -1) {
      options[filterIndex].enabled = e.target.checked;
      setFiltersSettings(updatedFiltersSetting);
    }
  };

  const toogleCriterion = (e, filterName, criterionKey) => {
    const updatedFiltersSetting = { ...filtersSettings };
    const options = updatedFiltersSetting.presets.options;
    const filterIndex = options.findIndex(
      (filter) => filter.name === filterName
    );

    if (filterIndex !== -1) {
      const critarionIndex = options[filterIndex].criteria.findIndex(
        (criterion) => criterion.key === criterionKey
      );
      if (critarionIndex !== -1) {
        options[filterIndex].criteria[critarionIndex].enabled =
          e.target.checked;
        setFiltersSettings(updatedFiltersSetting);
      }
    }
  };

  const toogleAction = (filterName, action) => {
    const updatedFiltersSetting = { ...filtersSettings };
    const options = updatedFiltersSetting.presets.options;
    const filterIndex = options.findIndex(
      (filter) => filter.name === filterName
    );

    if (filterIndex !== -1) {
      const actions = options[filterIndex].actions;
      const isEnabled = actions.includes(action);

      if (isEnabled) {
        const index = actions.indexOf(action);
        if (index !== -1) {
          actions.splice(index, 1);
        }
      } else {
        actions.push(action);
        if (action === "timeoutUser") {
          setTimeoutConfigFilterName(filterName);
          setIsTimeoutMember(true);
        }
      }
      setFiltersSettings(updatedFiltersSetting);
    }
  };

  const handleChangeTimeoutDuration = (event) => {
    const updatedFiltersSetting = { ...filtersSettings };
    const options = updatedFiltersSetting.presets.options;
    const filterIndex = options.findIndex(
      (filter) => filter.name === timeoutConfigFilterName
    );
    if (filterIndex !== -1) {
      const actionConfig = options[filterIndex].actionConfig;
      actionConfig.timeoutDuration = event.target.value;
      setFiltersSettings(updatedFiltersSetting);
    }
  };

  const getFilterTimeoutDuration = () => {
    const updatedFiltersSetting = { ...filtersSettings };
    const options = updatedFiltersSetting.presets.options;
    if (options?.length) {
      const filterIndex = options.findIndex(
        (filter) => filter.name === timeoutConfigFilterName
      );
      if (filterIndex !== -1) {
        const actionConfig = options[filterIndex].actionConfig;
        return actionConfig.timeoutDuration;
      }
    }
    return "1-min";
  };

  const getCritarionDescription = (criterion) => {
    switch (criterion.key) {
      case "postsInOneHour":
        return `${criterion.threshold} posts within an hour`;
      case "tooManyHashtags":
        return `Posts with up to ${criterion.threshold} hashtags`;
      case "shortPost":
        return `Posts with fewer than ${criterion.threshold} characters`;
      default:
        return "";
    }
  };

  const getFilterInfo = (name) => {
    switch (name) {
      case "Spam Filter":
        return {
          title: "Block Spam Post",
          description: "Protect your community from spam",
        };
      default:
        return "";
    }
  };

  const updateFiltersSetting = async () => {
    setIsSavingSetting(true);
    try {
      await axiosInstance.patch(`/communities/${communityData._id}`, {
        moderationFilters: filtersSettings,
      });
      getCommunity();
      onClose();
    } catch (err) {
      toast.error("Something went wrong. Please try again");
    } finally {
      setIsSavingSetting(false);
    }
  };

  const deleteGeneratedFilter = async (filterId) => {
    try {
      await axiosInstance.delete(`/communities/generated-filters`, {
        data: { communityId: communityData._id, filterId },
      });
      const updatedFiltersSetting = { ...filtersSettings };
      updatedFiltersSetting.generatedFilters.options =
        updatedFiltersSetting.generatedFilters.options.filter(
          (filter) => filter._id !== filterId
        );
      setFiltersSettings(updatedFiltersSetting);
    } catch (err) {
      toast.error("Something went wrong. Please try again");
    }
  };

  const saveCustomFilter = async () => {
    try {
      const res = await axiosInstance.post(`/communities/generated-filters`, {
        communityId: communityData._id,
        filterTitle: filterEvaluationResult.title,
        filterDescription: filterEvaluationResult.description,
      });
      const updatedFiltersSetting = { ...filtersSettings };
      updatedFiltersSetting.generatedFilters.options = res.data;
      setFilterElavationResult({});
      setCustomFilterTitle("");
      setFiltersSettings(updatedFiltersSetting);
    } catch (err) {
      toast.error("Something went wrong. Please try again");
    }
  };

  return (
    <Modal open={open} isBackdropClose={false}>
      <div className="max-h-[600px] relative overflow-y-auto scrollbar-hidden">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2 ">
            <X
              size={20}
              weight="bold"
              onClick={() => {
                setFiltersSettings(filters);
                setIsExpandBlockSpam(false);
                onClose();
              }}
              className="cursor-pointer"
            />
            <h3 className="font-medium text-lg">Auto Moderation</h3>
          </div>
          <Button
            variant="contained"
            disabled={isSavingSettings}
            onClick={updateFiltersSetting}
            className={`normal-case py-1 rounded-full bg-teal-500 disabled:bg-slate-300`}
          >
            Save
          </Button>
        </div>
        <p className="text-slate-600 pb-2">
          Automatically identifies and removes harmful content, creating a more
          welcoming environment for all community members.
        </p>
        <div className="mt-4 px-3 rounded-md pt-2 pb-3 border border-solid border-slate-300">
          <div>
            <div className="flex justify-between items-center">
              <h3 className="font-semibold flex-1 py-2 rounded-md text-slate-600">
                Presets
              </h3>
              <Android12Switch
                checked={filtersSettings.presets?.enabled || false}
                onChange={tooglePresets}
              />
            </div>
          </div>
          <div
            className={`grid max-h-[300px] overflow-y-auto scrollbar-hidden ${
              !filtersSettings.presets?.enabled ? " text-slate-600" : ""
            }`}
          >
            {filtersSettings.presets?.options?.map((filter) => {
              return (
                <div
                  key={filter._id}
                  className={`rounded-md border border-solid bg-slate-100 border-slate-300 ${
                    isExpandBlockSpam ? " cursor-default" : "cursor-pointer"
                  }  p-3 relative `}
                  onClick={(e) =>
                    !isExpandBlockSpam && setIsExpandBlockSpam(true)
                  }
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-semibold">
                        {getFilterInfo(filter.name).title}
                      </span>
                      <p className="text-sm">
                        {getFilterInfo(filter.name).description}
                      </p>
                      {!isExpandBlockSpam && (
                        <span className="bg-slate-200 px-2 py-1 rounded-full text-sm mt-2 block w-fit">
                          {
                            filter.criteria.filter(
                              (criterion) => criterion.enabled
                            ).length
                          }{" "}
                          Active criteria
                        </span>
                      )}
                    </div>
                    {isExpandBlockSpam ? (
                      <Android12Switch
                        checked={filter.enabled}
                        sx={{
                          "& .MuiSwitch-switchBase": {
                            "&.Mui-checked": {
                              "& + .MuiSwitch-track": {
                                backgroundColor: filtersSettings.presets
                                  ?.enabled
                                  ? "green"
                                  : "#475569",
                              },
                            },
                            "& + .MuiSwitch-track": {
                              backgroundColor:
                                filtersSettings.presets?.enabled &&
                                filter.enabled
                                  ? "green"
                                  : "#475569",
                            },
                          },
                        }}
                        onChange={(e) => toogleEnableFilter(e, filter.name)}
                      />
                    ) : (
                      <span
                        className={` text-sm rounded-full px-2 py-1 ${
                          filtersSettings.presets?.enabled && filter.enabled
                            ? "bg-green-200 text-slate-800"
                            : "bg-slate-200"
                        }`}
                      >
                        {filter.enabled ? "Enabled" : "Disabled"}
                      </span>
                    )}
                  </div>
                  {isExpandBlockSpam && (
                    <div>
                      <h4 className="mt-3 mb-1 font-medium">Criteria</h4>
                      {filter.criteria.map((criterion) => (
                        <div key={criterion._id} className="grid gap-1 ">
                          <div className="flex justify-between gap-2 ">
                            <span className="">
                              {getCritarionDescription(criterion)}
                            </span>
                            <Checkbox
                              disabled={!filtersSettings.presets?.enabled}
                              checked={criterion.enabled}
                              onChange={(e) =>
                                toogleCriterion(e, filter.name, criterion.key)
                              }
                              size="small"
                              className={`h-fit ${
                                !filtersSettings.presets?.enabled
                                  ? "text-slate-400"
                                  : ""
                              }`}
                              sx={{
                                padding: 0,
                                "&.Mui-checked": {
                                  color: teal[500],
                                },
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {isExpandBlockSpam && (
                    <div>
                      <h4 className="mt-3 mb-1 fon<t-medium">Action</h4>
                      <div>
                        <div className="flex items-center gap-1">
                          <Checkbox
                            disabled={!filtersSettings.presets?.enabled}
                            checked={filter.actions.includes("blockPost")}
                            onChange={() =>
                              toogleAction(filter.name, "blockPost")
                            }
                            size="small"
                            className={`h-fit ${
                              !filtersSettings.presets?.enabled
                                ? "text-slate-400"
                                : ""
                            }`}
                            sx={{
                              padding: 0,
                              "&.Mui-checked": {
                                color: teal[500],
                              },
                            }}
                          />
                          Block post
                        </div>
                        <div className="flex items-center gap-1">
                          <Checkbox
                            disabled={!filtersSettings.presets?.enabled}
                            checked={filter.actions.includes("timeoutUser")}
                            onChange={(e) =>
                              toogleAction(filter.name, "timeoutUser")
                            }
                            size="small"
                            className={`h-fit ${
                              !filtersSettings.presets?.enabled
                                ? "text-slate-400"
                                : ""
                            }`}
                            sx={{
                              padding: 0,
                              "&.Mui-checked": {
                                color: teal[500],
                              },
                            }}
                          />
                          Time out member
                        </div>
                      </div>
                    </div>
                  )}
                  <IconButton
                    className="p-1 absolute bottom-2 right-3 ml-auto block bg-white rounded-full border border-solid border-slate-300"
                    onClick={() => setIsExpandBlockSpam(!isExpandBlockSpam)}
                  >
                    {isExpandBlockSpam ? (
                      <CaretUp size={17} />
                    ) : (
                      <CaretDown size={17} />
                    )}
                  </IconButton>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-4 rounded-md border border-solid border-slate-300 py-2">
          <div className="px-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold flex-1 py-2 rounded-md text-slate-600">
                Genereated Filters
              </h3>
              <Android12Switch
                checked={filtersSettings.generatedFilters?.enabled || false}
                onChange={toogleGeneratedFilters}
              />
            </div>
            <p
              className={`text-sm mb-3 ${
                !filtersSettings.generatedFilters?.enabled
                  ? "text-slate-600"
                  : ""
              }`}
            >
              Specify the characteristics of posts that will determine whether
              they should be blocked in your community (e.g., posts spreading
              conspiracy theories about 5G).
            </p>

            <div
              className={`${
                !filtersSettings.generatedFilters?.enabled
                  ? "!text-slate-600"
                  : ""
              }`}
            >
              <div>
                <label htmlFor="custom-filter" className="font-medium mb-1">
                  Add Custom Filter
                </label>
                <div className="flex">
                  <div className="flex items-center flex-1 border-solid border border-slate-300 rounded-l-md h-[45px]">
                    <span className="bg-slate-300 font-medium text-slate-700 rounded-l-md px-3 py-1 h-full w-fit flex items-center justify-center">
                      Block...
                    </span>
                    <input
                      id="custom-filter"
                      readOnly={!filtersSettings.generatedFilters?.enabled}
                      value={customFilterTitle}
                      maxLength={50}
                      onChange={(e) => setCustomFilterTitle(e.target.value)}
                      className={`border-none bg-inherit px-2 flex-1 focus:outline-none ${
                        !filtersSettings.generatedFilters?.enabled
                          ? "cursor-default"
                          : ""
                      }`}
                      placeholder="posts with threats and insults"
                    />
                    <span
                      className={`pr-2 ${
                        filtersSettings.generatedFilters?.enabled
                          ? "text-slate-800"
                          : "text-slate-600"
                      }`}
                    >
                      {customFilterTitle.length}/50
                    </span>
                  </div>
                  <IconButton
                    variant="contained"
                    onClick={saveCustomFilter}
                    disabled={
                      isEvaluatingFilter || !filterEvaluationResult.description
                    }
                    className="rounded-r-md h-[45px] disabled:bg-slate-300 disabled:text-slate-500 self-end text-white rounded-none bg-orange-400"
                  >
                    <FloppyDisk size={25} />
                  </IconButton>
                </div>
                <div
                  className={`px-2 py-3 min-h-[100px] grid place-content-center ${
                    filterEvaluationResult.error
                      ? "bg-red-100 border border-solid border-red-300"
                      : "bg-slate-100"
                  } rounded-b-md`}
                >
                  {!Object.keys(filterEvaluationResult).length &&
                    !isEvaluatingFilter && (
                      <>
                        <div className="flex items-center justify-center gap-1">
                          <Notebook size={20} /> Filter Note
                        </div>
                        <p className="text-center text-sm text-slate-700">
                          A description of the action that will be carried out,
                          based on the information provided in the above input
                          field.
                        </p>
                      </>
                    )}
                  {!isEvaluatingFilter && (
                    <>
                      {filterEvaluationResult.description && (
                        <>
                          <div className="flex items-center justify-center gap-1">
                            <Notebook size={20} /> Filter Note
                          </div>
                          <p className="text-center text-sm text-slate-700">
                            {filterEvaluationResult.description}
                          </p>
                        </>
                      )}
                      {filterEvaluationResult.error && (
                        <>
                          <p className="text-center text-sm text-slate-700">
                            {filterEvaluationResult.error}
                          </p>
                        </>
                      )}
                    </>
                  )}
                  {isEvaluatingFilter && (
                    <CircleNotch className="animate-spin" size={20} />
                  )}
                </div>
              </div>

              <ul className="mt-5 list-disc list-outside ml-7 grid gap-4">
                {filtersSettings.generatedFilters.options?.map((filter) => (
                  <li
                    key={filter._id}
                    className="marker:text-3xl marker:text-teal-600"
                  >
                    <div className="flex gap-1">
                      <div className="flex-1">
                        <span className="font-semibold relative -top-1">
                          {filter.title}
                        </span>
                        <div className="text-sm px-2">
                          <div className="flex mb-1 items-center justify-center gap-1 w-fit">
                            <Notebook size={15} /> Filter note
                          </div>
                          <p>{filter.description}</p>
                        </div>
                      </div>
                      <div>
                        <IconButton
                          onClick={() => deleteGeneratedFilter(filter._id)}
                          className="block rounded-md mt-1 bg-slate-200"
                        >
                          <TrashSimple size={20} />
                        </IconButton>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Modal
        open={isTimeoutMember}
        isCloseIcon={true}
        modalLable="Time out member"
        customModal="max-w-[350px]"
        isBackdropClose={false}
        onClose={() => {
          toogleAction(timeoutConfigFilterName, "timeoutUser");
          setIsTimeoutMember(false);
        }}
      >
        <div>
          <p>
            Set the time period users are restricted from posting after breaking
            this rule.
          </p>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            className="w-full mt-3"
            value={getFilterTimeoutDuration()}
            onChange={handleChangeTimeoutDuration}
          >
            <MenuItem value="1-min">1 minute</MenuItem>
            <MenuItem value="1-hour">1 hour</MenuItem>
            <MenuItem value="1-day">1 day</MenuItem>
          </Select>

          <Button
            variant="contained"
            disableElevation
            onClick={() => setIsTimeoutMember(false)}
            className="normal-case block bg-teal-500 ml-auto mt-5 rounded-full "
          >
            Done
          </Button>
        </div>
      </Modal>
    </Modal>
  );
}

export default AutoMod;
