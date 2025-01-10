import style from "../styles/profileCard.module.css";
import { Button } from "@mui/material";
import { useRef, useState } from "react";
import EditProfile from "./EditProfile";
import Image from "next/image";

export default function ProfileCard({
  name,
  coverImage,
  profileImage,
  bio,
  setIsEditOpen,
  isEditOpen,
}) {
  const profileImageRef = useRef();
  const coverImageRef = useRef();

  const [editIsLoading, setEditIsLoading] = useState(false);
  const [coverPic, setCoverPic] = useState({ url: "", filename: "" });
  const [profilePic, setProfilePic] = useState({ url: "", filename: "" });

  const onImageChange = (event, setImage) => {
    if (event.target.files && event.target.files[0]) {
      if (event.target.files[0]["type"].split("/")[0] === "image") {
        let img = event.target.files[0];
        setImage({ url: URL.createObjectURL(img), filename: "" });
      }
    }
  };

  return (
    <div className="border border-solid border-slate-200 rounded-xl">
      <div className={style.profileCard}>
        <div className={style.coverImage}>
          <Image
            src={coverImage?.url ? coverImage?.url : "/assets/noCover.avif"}
            alt="cover"
            fill
          />
        </div>
        <div className={style.profileCard__profileImage}>
          <Image
            src={
              profileImage?.url ? profileImage?.url : "/assets/noProfile.jpg"
            }
            width={110}
            height={120}
            alt="profile"
          />
          <div>
            <Button
              className="border border-solid border-slate-300 rounded-md"
              onClick={() => setIsEditOpen(true)}
            >
              {editIsLoading ? "Updating..." : "Edit profile"}
            </Button>
          </div>
        </div>
        <div className={style.profileCard__details}>
          <h2 className="font-medium">{name}</h2>
          <p>{bio}</p>
        </div>
      </div>
      <EditProfile
        coverImage={coverImage}
        profileImage={profileImage}
        isEditOpen={isEditOpen}
        setIsEditOpen={setIsEditOpen}
        name={name}
        bio={bio}
        profileImageRef={profileImageRef}
        coverImageRef={coverImageRef}
        coverPic={coverPic}
        profilePic={profilePic}
        setProfilePic={setProfilePic}
        setCoverPic={setCoverPic}
        editIsLoading={editIsLoading}
        setEditIsLoading={setEditIsLoading}
      />
      <div style={{ display: "none" }}>
        <input
          type="file"
          name="profile"
          ref={profileImageRef}
          accept="image/*"
          onChange={(e) => onImageChange(e, setProfilePic)}
        />
        <input
          type="file"
          name="cover"
          ref={coverImageRef}
          accept="image/*"
          onChange={(e) => onImageChange(e, setCoverPic)}
        />
      </div>
    </div>
  );
}
