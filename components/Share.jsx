import React, { useState, useRef, useContext } from "react";
import style from "../styles/share.module.css";
import { Send } from "@mui/icons-material";
import { UserContext } from "@/providers/MyContext";
import Image from "next/image";
import { ImageSquare, X } from "@phosphor-icons/react";
import { AxiosError } from "axios";

const Share = ({ createPost }) => {
  const mediaRef = useRef(null);
  const { user } = useContext(UserContext);

  const [mediaUrl, setMediaUrl] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [postShareIsLoading, setPostShareIsLoading] = useState(false);

  const onMediaChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      let file = event.target.files[0];
      setMediaUrl(URL.createObjectURL(file));
    }
  };

  const removeMedia = () => {
    mediaRef.current.value = "";
    setMediaUrl("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!mediaUrl && !inputValue) return;
    setPostShareIsLoading(true);
    try {
      const media = mediaRef.current.files[0] || {};
      await createPost(inputValue, media);
      removeMedia();
      setInputValue("");
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.status === 403) {
          setError(err.response.data.message);
          removeMedia();
          setInputValue("");
          return;
        }
      }
      setError("Unable to upload post");
    } finally {
      setPostShareIsLoading(false);
    }
  };

  const isImage = () => {
    const file = mediaRef.current.files[0];

    if (file) {
      const fileType = file.type;
      return fileType.startsWith("image/");
    }
  };

  return (
    <div className={style.share__cont}>
      <div className={style.share}>
        <Image
          src={
            user?.profilePicture?.url
              ? user?.profilePicture?.url
              : "/assets/noPic.webp"
          }
          alt="profile"
          width={50}
          height={50}
        />
        <form onSubmit={handleSubmit}>
          {/* <input type="text" placeholder="What's happening" className="shareinput" /> */}
          <textarea
            placeholder="What's happening"
            className={style.shareinput}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          ></textarea>
          <div className={style.postOptions}>
            <div
              className={style.option}
              onClick={() => mediaRef.current.click()}
            >
              <ImageSquare size={25} className="mr-1" weight="fill" />
              Photo/Video
            </div>
            <button
              className={`button ${style["ps-button"]}`}
              disabled={postShareIsLoading}
            >
              Share
              <Send style={{ width: "20px", height: "20px" }} />
            </button>
            <div style={{ display: "none" }}>
              <input
                type="file"
                ref={mediaRef}
                accept="image/png, image/gif, image/jpeg, video/*"
                onChange={(e) => onMediaChange(e)}
              />
            </div>
          </div>
          {error && <span className={style.previewImage__error}>{error}</span>}
          {!error && postShareIsLoading && <span>Posting...</span>}

          {mediaRef.current?.files[0] && (
            <div className={style.previewImage}>
              {isImage() ? (
                <Image
                  width={0}
                  height={0}
                  sizes="100vw"
                  src={mediaUrl}
                  alt="post"
                />
              ) : (
                <video id="videoPlayer" controls src={mediaUrl}>
                  Your browser does not support the video tag.
                </video>
              )}
              <span onClick={removeMedia}>
                <X size={15} />
              </span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Share;
