import Modal from "./Modal";
import { AddAPhotoOutlined, CloseOutlined } from "@mui/icons-material";
import { TextField, Button } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import style from "../styles/profileCard.module.css";
import { toast } from "react-toastify";
import { UserContext } from "@/providers/MyContext";
import { configureAxios } from "@/utils/axiosInstance";

function EditProfile({
  setIsEditOpen,
  coverImage,
  profileImage,
  isEditOpen,
  name,
  bio,
  profileImageRef,
  coverImageRef,
  coverPic,
  profilePic,
  setProfilePic,
  setCoverPic,
  setEditIsLoading,
  editIsLoading,
}) {
  const { setUser } = useContext(UserContext);
  const axiosInstance = configureAxios(setUser);

  const [inputs, setInputs] = useState({ username: "", bio: "" });

  useEffect(() => {
    if (name) {
      setInputs({ username: name, bio: bio });
    }
  }, [name, bio]);

  useEffect(() => {
    if (isEditOpen) {
      setCoverPic(coverImage);
      setProfilePic(profileImage);
    }
  }, [isEditOpen, coverImage, profileImage, setCoverPic, setProfilePic]);

  // function to remove image from state and input field
  const clearImagesState = () => {
    setCoverPic({ url: "", filename: "" });
    setProfilePic({ url: "", filename: "" });
  };

  // // delete old image from firebase storage when user changes profile or cover image
  // const deleteFromFirebase = async (filename) => {
  //   const desertRef = ref(storage, `weConect/${filename}`);
  //   await deleteObject(desertRef);
  // };

  // // upload cover image and profile image to firebase storage if they are set in the file input
  // const uploadToFirebase = async (imageRef, picObject) => {
  //   setEditIsLoading(true);
  //   if (imageRef.current.files && imageRef.current.files[0]) {
  //     if (imageRef.current.files[0]["type"].split("/")[0] === "image") {
  //       const file = imageRef.current.files[0];
  //       const filename = file.name + Date.now();
  //       const storageRef = ref(storage, `weConect/${filename}`);
  //       const snapshot = await uploadBytes(storageRef, file);
  //       const url = await getDownloadURL(snapshot.ref);
  //       return {
  //         filename,
  //         url,
  //       };
  //     }
  //   }
  //   return {
  //     filename: picObject.filename,
  //     url: picObject.url,
  //   };
  // };

  const editUser = async (e) => {
    e.stopPropagation();
    setIsEditOpen(false);

    const formData = new FormData();

    formData.append("username", name);

    if (profilePic?.filename === "" && profilePic.url !== profileImage?.url) {
      formData.append("profilePicture", profileImageRef.current.files[0] || {});
    }
    if (coverPic?.filename === "" && coverPic.url !== coverImage?.url) {
      formData.append("coverPicture", coverImageRef.current.files[0] || {});
    }
    if (name !== inputs.username) {
      formData.append("username", inputs.username);
    }
    if (bio !== inputs.bio) {
      formData.append("bio", inputs.bio);
    }

    const hasValues = [...formData.entries()].length > 1;
    if (hasValues) {
      try {
        const res = await axiosInstance.patch("/user", formData);
        console.log(res.data, "This is the returne data");
        setUser(res.data);
        sessionStorage.setItem("user", JSON.stringify(res.data));
      } catch (err) {
        toast.error("Something went wrong. Please try again.");
      }
    }

    setEditIsLoading(false);
    clearImagesState();
  };

  const closeModal = () => {
    setIsEditOpen(false);
    clearImagesState();
  };

  return (
    <Modal
      open={isEditOpen}
      onClose={closeModal}
      isBackdropClose={false}
      modalLable="Edit profile"
      customModal={style.profileCard__editModal}
    >
      <div className={style.profileCard__edit}>
        <div className={style.profileCard__edit__head}>
          <div>
            <CloseOutlined
              onClick={(e) => {
                e.stopPropagation();
                closeModal();
              }}
              className={style.close}
            />
            <h3>Edit profile</h3>
          </div>
          <Button
            variant="contained"
            onClick={editUser}
            disabled={editIsLoading}
            className={`${
              editIsLoading ? "bg-slate-400 " : "bg-teal-500 white"
            } `}
          >
            {editIsLoading ? "Saving..." : "Save"}
          </Button>
        </div>
        <div className={style.profileCard__edit__coverImage}>
          <img
            src={coverPic?.url ? coverPic?.url : "/assets/noCover.avif"}
            alt="cover"
          />
          <div className={style.profileCard__edit__coverImage__icons}>
            <AddAPhotoOutlined
              onClick={(e) => {
                e.stopPropagation();
                coverImageRef.current.click();
              }}
            />
            {coverPic?.url && (
              <CloseOutlined
                onClick={(e) => {
                  e.stopPropagation();
                  setCoverPic({ url: "", filename: "" });
                  coverImageRef.current.value = "";
                }}
              />
            )}
          </div>
        </div>
        <div className={style.profileCard__profileImage}>
          <img
            src={profilePic?.url ? profilePic?.url : "/assets/noProfile.jpg"}
            alt="profile"
          />
          <div
            className={`${style.profileCard__edit__coverImage__icons} ${style.mod}`}
          >
            <AddAPhotoOutlined
              onClick={(e) => {
                e.stopPropagation();
                profileImageRef.current.click();
              }}
            />
            {profilePic?.url && (
              <CloseOutlined
                onClick={(e) => {
                  e.stopPropagation();
                  setProfilePic({ url: "", filename: "" });
                  profileImageRef.current.value = "";
                }}
              />
            )}
          </div>
        </div>
        <div className={style.profileCard__editInputs}>
          {/* <TextField
            id="outlined-basic"
            label="username"
            value={inputs.username}
            onChange={(e) => setInputs({ ...inputs, username: e.target.value })}
          /> */}
          <TextField
            id="outlined-basic"
            label="bio"
            variant="outlined"
            value={inputs.bio}
            onChange={(e) => setInputs({ ...inputs, bio: e.target.value })}
            multiline
            rows={2}
          />
        </div>
      </div>
    </Modal>
  );
}

export default EditProfile;
