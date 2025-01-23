import { Check, PencilSimpleLine } from "@phosphor-icons/react";
import Link from "next/link";
import React, { useContext, useEffect, useRef, useState } from "react";
import ProfileCard from "./ProfileCard";
import { UserContext } from "@/providers/MyContext";
import { signIn } from "@/utils/api";
import Modal from "./Modal";
import { IconButton } from "@mui/material";

function LeftSide() {
  const usernameEditRef = useRef();
  const { user, setUser } = useContext(UserContext);

  const [username, setUsername] = useState("");
  const [isUsernameReadOnly, setIsUsernameReadOnly] = useState(true);

  useEffect(() => {
    usernameEditRef.current.value = user?.username || "";
  }, [user]);

  useEffect(() => {
    const storageUser = sessionStorage.getItem("user");
    setUser(JSON.parse(storageUser));
  }, []);

  const updatedSignedInUser = async () => {
    setIsUsernameReadOnly(!isUsernameReadOnly);
    const updatedUsername = usernameEditRef.current.value;
    if (!isUsernameReadOnly && updatedUsername !== user.username) {
      await signIn(updatedUsername, setUser);
    }
  };

  return (
    <div className="three-cols__left">
      <Link href="/" className="logo">
        <h1>weConect</h1>
      </Link>
      <div className="flex gap-1 mt-2 mb-1">
        <input
          ref={usernameEditRef}
          className={`focus:outline-none rounded-md flex-1 px-2 read-only:text-slate-500`}
          // onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          readOnly={isUsernameReadOnly}
        />
        <span
          onClick={updatedSignedInUser}
          className="p-2 bg-orange-400 rounded-md text-white cursor-pointer"
        >
          {isUsernameReadOnly ? (
            <PencilSimpleLine size={20} />
          ) : (
            <Check size={20} />
          )}
        </span>
      </div>
      <ProfileCard
        name={user?.username}
        coverImage={user?.coverPicture}
        profileImage={user?.profilePicture}
        bio={user?.bio}
      />
      <Modal
        open={user === null}
        customContainer="z-[100%]"
        customModal="w-[400px] shadow-sm"
      >
        <div className="shadow-sm">
          <label htmlFor="username" className="font-medium mb-1 block">
            Username
          </label>
          <div className="flex items-center ">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-[45px] flex-1 placeholder:text-slate-400 px-2 focus:outline-none border border-solid border-slate-300"
              id="username"
              placeholder="Enter your username"
            />
            <IconButton
              className="bg-orange-500 ml-1 hover:bg-orange-600 h-[45px] w-[45px] rounded-md text-white"
              sx={{
                borderRadius: "8px",
                backgroundColor: "rgb(249 115 22)",
                marginLeft: "8px",
                color: "white",
                "&:hover": { backgroundColor: "rgb(234 88 12)" },
                "&.Mui-disabled": {
                  backgroundColor: "rgb(148 163 184)",
                },
              }}
              disabled={!username.trim() || user === undefined}
              onClick={() => signIn(username, setUser)}
            >
              <Check weight="bold" size={25} />
            </IconButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default LeftSide;
