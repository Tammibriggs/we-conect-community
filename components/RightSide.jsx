import { Button, TextField } from "@mui/material";
import { CircleNotch, Plus, X } from "@phosphor-icons/react";
import Modal from "./Modal";
import { useContext, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AddAPhotoOutlined, CloseOutlined } from "@mui/icons-material";
import { toast } from "react-toastify";
import { UserContext } from "@/providers/MyContext";
import { configureAxios } from "@/utils/axiosInstance";
import CommunityCard from "./CommunityCard";
import { useRouter } from "next/router";

function RightSide() {
  const router = useRouter();
  const coverImageInputRef = useRef();
  const { user, setUser } = useContext(UserContext);
  const axiosInstance = configureAxios(setUser);

  const [isCreateCommunity, setIsCreateCommunity] = useState(false);
  const [coverImage, setCoverImage] = useState({
    url: "",
    filename: "",
  });
  const [inputs, setInputs] = useState({ name: "", description: "" });
  const [communities, setCommunities] = useState();

  useEffect(() => {
    getMyCommunities();
  }, [user]);

  const onImageChange = (event, setImage) => {
    if (event.target.files && event.target.files[0]) {
      if (event.target.files[0]["type"].split("/")[0] === "image") {
        let img = event.target.files[0];
        setImage({ url: URL.createObjectURL(img), filename: "" });
      }
    }
  };

  const getMyCommunities = async () => {
    try {
      const res = await axiosInstance.get("/communities");
      setCommunities(res.data);
    } catch (err) {
      setCommunities(null);
    }
  };

  const createCommunity = async () => {
    try {
      const coverImageFile = coverImageInputRef.current.files[0];
      const formData = new FormData();
      formData.append("username", user.username);
      formData.append("name", inputs.name);
      if (inputs.description) {
        formData.append("description", inputs.description);
      }
      if (coverImageFile) {
        formData.append("coverPicture", coverImageFile);
      }
      const res = await axiosInstance.post("/communities", formData);
      // getMyCommunities();
      router.push(`/${res.data._id}`);
    } catch (err) {
      return toast.error("Something went wroong.Please try again");
    } finally {
    }
  };

  return (
    <div className="three-cols__right">
      <div className="p-3 rounded-xl bg-white border border-solid border-slate-200">
        <h2 className="font-medium text-lg mb-2 flex">
          Communities you manage{" "}
          <span
            onClick={() => setIsCreateCommunity(true)}
            className="bg-orange-100 p-1 border border-solid border-orange-300 cursor-pointer rounded-lg ml-auto text-orange-500"
          >
            <Plus size={18} weight="bold" />
          </span>{" "}
        </h2>
        <div className="overflow-y-auto flex-col gap-2 flex items-center w-full min-h-[150px]">
          {communities?.map((community) => (
            <CommunityCard key={community._id} community={community} />
          ))}
          {communities === undefined && (
            <CircleNotch size={20} className="text-teal-500 animate-spin" />
          )}
          {communities?.length === 0 && (
            <Button
              onClick={() => setIsCreateCommunity(true)}
              className="text-teal-600 mt-[20%] normal-case font-semibold gap-1 px-2 flex items-center text-sm bg-teal-100 hover:bg-teal-200 rounded-md"
            >
              <Plus size={15} /> Create new community
            </Button>
          )}
        </div>
      </div>
      <div className="max-h-[50%] flex-1 bg-white p-3 rounded-xl border border-solid border-slate-200">
        <h2 className="font-medium text-lg mb-2">Joined communities</h2>
        <div className="overflow-y-auto h-full flex-col flex items-center w-full">
          <span className="mt-[50%]">You haven't joined any community</span>
        </div>
      </div>
      <Modal
        open={isCreateCommunity}
        isBackdropClose={false}
        onClose={() => setIsCreateCommunity(false)}
      >
        <div>
          <div className="flex items-center gap-5 mb-4">
            <X
              onClick={() => setIsCreateCommunity(false)}
              size={20}
              className="cursor-pointer"
              weight="bold"
            />
            <h2 className="font-medium text-lg">Create a new Community</h2>
          </div>
          <div className="relative w-full h-[200px]">
            <Image
              src={coverImage.url || "/assets/community.svg"}
              alt="community cover"
              className="object-cover"
              fill
            />
            <div className="absolute top-[45%] right-[50%] translate-x-[50%] ">
              <AddAPhotoOutlined
                className="rounded-full text-white bg-black bg-opacity-60 cursor-pointer text-5xl p-3 mr-2"
                onClick={(e) => {
                  e.stopPropagation();
                  coverImageInputRef.current.click();
                }}
              />
              {coverImage?.url && (
                <CloseOutlined
                  className="rounded-full text-white bg-black bg-opacity-60 cursor-pointer text-5xl p-3 mr-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCoverImage({ url: "", filename: "" });
                    coverImageInputRef.current.value = "";
                  }}
                />
              )}
            </div>
          </div>
          <TextField
            id="outlined-basic"
            label="Community name"
            className="w-full mt-4"
            value={inputs.name}
            onChange={(e) => setInputs({ ...inputs, name: e.target.value })}
          />
          <TextField
            id="outlined-basic"
            label="Community description"
            className="w-full mt-4"
            value={inputs.description}
            onChange={(e) =>
              setInputs({ ...inputs, description: e.target.value })
            }
            multiline
            rows={4}
          />
          <input
            type="file"
            name="cover"
            className="hidden"
            ref={coverImageInputRef}
            accept="image/*"
            onChange={(e) => onImageChange(e, setCoverImage)}
          />
          <Button
            variant="contained"
            onClick={createCommunity}
            disabled={!inputs.name || !inputs.description}
            className="ml-auto block mt-3 disabled:bg-slate-300 rounded-full normal-case bg-teal-500"
          >
            Create
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default RightSide;
