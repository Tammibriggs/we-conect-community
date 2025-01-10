import React, { useContext, useState } from "react";
import Modal from "./Modal";
import { Button, TextField } from "@mui/material";
import { toast } from "react-toastify";
import { configureAxios } from "@/utils/axiosInstance";
import { UserContext } from "@/providers/MyContext";
import communityData from "@/server/utils/communityData";

const exampleRules = [
  {
    title: "Be Kind and Contribute Positively",
    description:
      "Our community is built on mutual respect and constructive engagement. We encourage open discussions and diverse viewpoints, but all interactions must be respectful. Personal attacks, insults, harassment, and derogatory language will not be tolerated. Focus on the topic at hand and offer thoughtful contributions. Please remember that there are real people behind every profile, and treat them with the kindness you would expect in return.",
  },
  {
    title: "Stay On-Topic and Keep it Relevant",
    description:
      "This community is intended for meaningful discussions and valuable contributions. Please ensure your posts, comments, and discussions are relevant to the general purpose and themes of this group. Off-topic content, spam, and unrelated self-promotion will be removed. Let's strive to maintain a focused and engaging environment by contributing content that aligns with the community's overall goals and interests.",
  },
  {
    title: "Protect Your Privacy and Respect Others",
    description:
      "Protect your personal information and do not share sensitive details about yourself or others within the community. Avoid posting private addresses, phone numbers, or any other information that could compromise someone's privacy. Be mindful of the information you share and ensure it doesn't violate anyone's personal rights. Remember that information shared here may be viewed by a large audience.",
  },
];

function CreateCommunityRule({
  open,
  onClose = () => {},
  getCommunity = () => {},
}) {
  const { setUser } = useContext(UserContext);
  const axiosInstance = configureAxios(setUser);

  const [ruleInputs, setRuleInputs] = useState({ title: "", description: "" });
  const [isLoading, setIsLoading] = useState(false);

  const addRule = async () => {
    try {
      setIsLoading(true);
      await axiosInstance.post(`/communities/rules`, {
        communityId: communityData._id,
        ...ruleInputs,
      });
      getCommunity();
      setRuleInputs({ title: "", description: "" });
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
      modalLable="Create Rule"
      isCloseIcon={true}
      isBackdropClose={false}
    >
      <div>
        <div className="mt-4">
          <h4 className="font-semibold text-lg mb-2">Example Rules</h4>
          <div className="flex gap-2 flex-wrap">
            {exampleRules.map((rule) => (
              <span
                key={rule.title}
                onClick={() =>
                  setRuleInputs({
                    title: rule.title,
                    description: rule.description,
                  })
                }
                className="rounded-full bg-gray-200 px-3 py-1 hover:font-medium cursor-pointer"
              >
                {rule.title}
              </span>
            ))}
          </div>
        </div>
        <div className="grid gap-3 mt-4">
          <h4 className="font-semibold text-lg">Write new rule</h4>
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
          onClick={addRule}
          className="normal-case disabled:bg-slate-300 block mt-4 bg-teal-500 ml-auto rounded-full"
        >
          Create
        </Button>
      </div>
    </Modal>
  );
}

export default CreateCommunityRule;
