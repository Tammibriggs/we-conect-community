import React, { useContext, useEffect, useState } from "react";
import Modal from "./Modal";
import { Button, TextField } from "@mui/material";
import { toast } from "react-toastify";
import { configureAxios } from "@/utils/axiosInstance";
import { UserContext } from "@/providers/MyContext";
import communityData from "@/server/utils/communityData";

function EditCommunityRule({
  open,
  onClose = () => {},
  rule = {},
  getCommunity = () => {},
}) {
  const { setUser } = useContext(UserContext);
  const axiosInstance = configureAxios(setUser);

  const [ruleInputs, setRuleInputs] = useState({
    title: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (Object.keys(rule).length > 0) {
      setRuleInputs({ title: rule.title, description: rule.description });
    }
  }, [open]);

  const editRule = async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.patch("/communities/rules", {
        communityId: communityData._id,
        ruleId: rule._id,
        ...ruleInputs,
      });
      getCommunity();
      onClose();
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      modalLable="Edit Rule"
      isCloseIcon={true}
      isBackdropClose={false}
    >
      <div>
        <div className="grid gap-3 mt-4">
          <TextField
            id="outlined-basic"
            label="Title"
            variant="outlined"
            value={ruleInputs.title}
            onChange={(e) =>
              setRuleInputs({ ...ruleInputs, title: e.target.value })
            }
          />
          <TextField
            id="outlined-basic"
            label="Description"
            variant="outlined"
            value={ruleInputs.description}
            onChange={(e) =>
              setRuleInputs({ ...ruleInputs, description: e.target.value })
            }
            multiline
            rows={4}
          />
        </div>
        <Button
          disabled={isLoading}
          variant="contained"
          onClick={editRule}
          className="normal-case disabled:bg-slate-300 block mt-4 bg-teal-500 ml-auto rounded-full"
        >
          Update
        </Button>
      </div>
    </Modal>
  );
}

export default EditCommunityRule;
