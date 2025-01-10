import { UserContext } from "@/providers/MyContext";
import { Button, Menu, MenuItem } from "@mui/material";
import { DotsThreeVertical } from "@phosphor-icons/react";
import { useContext, useState } from "react";
import CreateCommunityRule from "./CreateCommunityRule";
import EditCommunityRule from "./EditCommunityRule";
import { configureAxios } from "@/utils/axiosInstance";
import { toast } from "react-toastify";
import communityData from "@/server/utils/communityData";

function CommunityRules({
  rules,
  ownerId,
  isCreatingRule,
  setIsCreatingRule,
  getCommunity = () => {},
}) {
  const { user, setUser } = useContext(UserContext);
  const axiosInstance = configureAxios(setUser);

  const [isEditingRule, setIsEditingRule] = useState(false);
  const [activeMenuRuleId, setActiveMenuRuleId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClickRuleMenu = (event, ruleId) => {
    setAnchorEl(event.currentTarget);
    setActiveMenuRuleId(ruleId);
  };

  const handleCloseRuleMenu = () => {
    setAnchorEl(null);
  };

  const handleEditRule = () => {
    setIsEditingRule(true);
    handleCloseRuleMenu();
  };

  const handleDeleteRule = async () => {
    handleCloseRuleMenu();
    try {
      await axiosInstance.delete("/communities/rules", {
        data: { communityId: communityData._id, ruleId: activeMenuRuleId },
      });
      getCommunity();
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="py-2">
      {rules?.length ? (
        <ul className="grid gap-4">
          {rules.map((rule, i) => (
            <li className="flex gap-2" key={rule._id}>
              <div className="rounded-md bg-gray-200 text-slate-800 font-medium h-fit px-1">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <h4 className="font-medium  font-sans">{rule.title}</h4>
                  {ownerId === user?._id && (
                    <div>
                      <span
                        className="cursor-pointer"
                        onClick={(e) => handleClickRuleMenu(e, rule._id)}
                      >
                        <DotsThreeVertical weight="bold" size={20} />
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm font-sans text-slate-700">
                  {rule.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div>
          <span className="block text-center">No rules have been set</span>
          {ownerId === user?._id && (
            <Button
              variant="outlined"
              onClick={() => {
                setIsCreatingRule(true);
              }}
              disableElevation
              className="rounded-lg block mx-auto mt-1 normal-case text-teal-600 border border-solid border-teal-500"
            >
              Set up rules
            </Button>
          )}
        </div>
      )}

      <CreateCommunityRule
        open={isCreatingRule}
        onClose={() => setIsCreatingRule(false)}
        getCommunity={getCommunity}
      />
      <EditCommunityRule
        open={isEditingRule}
        onClose={() => setIsEditingRule(false)}
        rule={rules?.find((rule) => rule._id === activeMenuRuleId)}
        getCommunity={getCommunity}
      />
      <Menu
        elevation={0}
        anchorEl={anchorEl}
        open={open}
        className="shadow-md"
        sx={{
          ".MuiPaper-root": {
            boxShadow:
              "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          },
        }}
        onClose={handleCloseRuleMenu}
        MenuListProps={{
          sx: {
            padding: 0,
          },
          "aria-labelledby": "basic-button",
        }}
      >
        <MenuItem
          sx={{
            fontSize: "12px",
          }}
          onClick={handleEditRule}
        >
          Edit
        </MenuItem>
        <MenuItem
          sx={{
            fontSize: "12px",
          }}
          onClick={handleDeleteRule}
        >
          Delete
        </MenuItem>
      </Menu>
    </div>
  );
}

export default CommunityRules;
