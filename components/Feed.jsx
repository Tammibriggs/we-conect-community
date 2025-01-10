import style from "../styles/feed.module.css";
import Post from "./Post";

export default function Feed({ posts }) {
  return (
    <div className={`${style.feed} ${style["scrollbar-hidden"]}`} id="feedAlt">
      <div className={style.feed__wrapper}>
        {posts?.map((post) => (
          <Post
            key={post._id}
            id={post._id}
            author={post.author}
            likes={post.likes}
            media={post.media}
            content={post.content}
            createdAt={post.createdAt}
          />
        ))}
      </div>
    </div>
  );
}
