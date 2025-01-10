import { useContext, useEffect, useState } from "react";
import style from "../styles/post.module.css";
import Image from "next/image";
import { useRouter } from "next/router";
import { dateDifference, formatNumber } from "@/utils";
import { configureAxios } from "@/utils/axiosInstance";
import { UserContext } from "@/providers/MyContext";

const Post = ({ id, author, likes, content, media, createdAt }) => {
  const router = useRouter();
  const { user, setUser } = useContext(UserContext);
  const axiosInstance = configureAxios(setUser);

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  1;
  useEffect(() => {
    setIsLiked(likes.includes(user._id));
    setLikeCount(likes.length);
  }, []);

  const toogleLike = async () => {
    try {
      axiosInstance.post("/community-posts/like", {
        postId: id,
      });
      setIsLiked(!isLiked);
      if (isLiked) {
        setLikeCount(likeCount - 1);
      } else {
        setLikeCount(likeCount + 1);
      }
    } catch (err) {
      setIsLiked(!isLiked);
      if (isLiked) {
        setLikeCount(likeCount - 1);
      } else {
        setLikeCount(likeCount + 1);
      }
    }
  };

  return (
    <div className={style.post}>
      <div className={style.post__head}>
        <div>
          <Image
            src={author?.profilePicture?.url || "/assets/noPic.webp"}
            width={50}
            onClick={() => router.push(`/profile?id=${userId}`)}
            height={50}
            alt="profile"
          />
          <span>
            <span className={style.post__posterName}>{author?.username}</span>
            <span>{dateDifference(createdAt)}</span>
          </span>
        </div>
      </div>
      <p>{content}</p>
      {media?.url && (
        <Image
          src={media.url}
          width={0}
          height={0}
          sizes="100vw"
          alt="post pic"
        />
      )}
      <div className={style.postReact}>
        <span>
          <Image
            src={isLiked ? "/assets/like.png" : "/assets/notlike.png"}
            alt="post"
            width={20}
            height={20}
            onClick={toogleLike}
          />
          {formatNumber(likeCount)}
        </span>
      </div>
    </div>
  );
};

export default Post;
