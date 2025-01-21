import LeftSide from "@/components/LeftSide";
import { UserContext } from "@/providers/MyContext";
import { configureAxios } from "@/utils/axiosInstance";
import { Button, IconButton } from "@mui/material";
import {
  CircleNotch,
  GlobeHemisphereEast,
  Plus,
  Robot,
} from "@phosphor-icons/react";
import Head from "next/head";
import Image from "next/image";
import React, { useContext, useEffect, useState } from "react";
import Share from "@/components/Share";
import communityData from "@/server/utils/communityData";
import Feed from "@/components/Feed";
import CommunityRules from "@/components/CommunityRules";
import AutoMod from "@/components/AutoMod";

function Community() {
  const { user, setUser } = useContext(UserContext);
  const axiosInstance = configureAxios(setUser);

  const [community, setCommunity] = useState();
  const [posts, setPosts] = useState();
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [isAutoMod, setIsAutoMod] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    if (user) {
      getCommunity();
    }
  }, [user]);

  useEffect(() => {
    if (community) {
      (async () => {
        try {
          const res = await axiosInstance.get(
            `/community-posts/?communityId=${communityData._id}`
          );
          setPosts(res.data);
        } catch (err) {
          setPosts(null);
        }
      })();
    }
  }, [community]);

  const getCommunity = async () => {
    try {
      const res = await axiosInstance.get(`/communities/${communityData._id}`);
      setCommunity(res.data);
    } catch (err) {
      setCommunity(null);
    }
  };

  const createPost = async (content, media) => {
    const formData = new FormData();

    if (media) {
      formData.append("media", media);
    }

    formData.append("content", content);
    formData.append("communityId", communityData._id);
    const res = await axiosInstance.post("/community-posts", formData);
    setPosts([res.data, ...(posts ? posts : [])]);
  };

  const capitalizeFirstChar = () => {
    if (community && user) {
      const currentUser = community.members?.find(
        (member) => member.userId === user._id
      );
      return (
        currentUser?.role.charAt(0).toUpperCase() + currentUser?.role?.slice(1)
      );
    }
    return "";
  };

  return (
    <>
      <Head>
        <title>{community?.name || "Community"}</title>
      </Head>
      <div className="three-cols">
        <LeftSide />
        <div className="three-cols__center scrollbar-hidden mb-4">
          <div className="w-full bg-teal-50 min-h-[400px] border-b border-solid border-slate-200 rounded-b-lg">
            <div className="relative w-full h-[250px]">
              <Image
                src={community?.coverPicture?.url || "/assets/community.svg"}
                alt="community"
                className="object-cover bg-orange-100"
                fill
              />
            </div>
            <div className="p-3">
              <div className="flex mb-2 items-center justify-between">
                <h1 className="font-semibold text-2xl ">{community?.name}</h1>
                <span className="px-2 py-1 border border-solid border-teal-500 rounded-full bg-teal-100 text-teal-600">
                  {capitalizeFirstChar()}
                </span>
              </div>
              <div className="flex items-center">
                <span className="flex items-center gap-1 text-slate-600">
                  <GlobeHemisphereEast size={15} /> Public
                </span>
                <span className="mb-2 mx-1">.</span>
                <span className="">
                  {community?.members?.length} Member
                  {community?.members?.length === 1 ? "" : "s"}
                </span>
              </div>
              {community?.ownerId === user?._id && (
                <Button
                  variant="outlined"
                  onClick={() => setIsAutoMod(true)}
                  startIcon={<Robot size={25} />}
                  className="flex ml-auto  rounded-full border-slate-400 normal-case gap-1 text-black items-center font-medium"
                >
                  Auto Moderation
                </Button>
              )}
            </div>
          </div>
          <div className="mt-2 grid gap-[10px]">
            <Share createPost={createPost} />
            {!!posts?.length && <Feed posts={posts} />}
            {posts === undefined && (
              <CircleNotch
                size={30}
                className="text-teal-500 mx-auto mt-5 animate-spin"
              />
            )}
          </div>
        </div>
        <div className="three-cols__right">
          <div className="p-3  rounded-xl bg-white border border-solid border-slate-200">
            <div className="flex justify-between">
              <h2 className="font-medium text-lg mb-2 ">Community Rules</h2>
              {community?.ownerId === user?._id && (
                <IconButton
                  onClick={() => setIsCreatingRule(true)}
                  className="p-1 h-fit rounded-full text-white bg-teal-500 cursor-pointer"
                >
                  <Plus weight="bold" size={15} />
                </IconButton>
              )}
            </div>
            <CommunityRules
              rules={community?.rules}
              ownerId={community?.ownerId}
              isCreatingRule={isCreatingRule}
              setIsCreatingRule={setIsCreatingRule}
              getCommunity={getCommunity}
            />
          </div>
        </div>
      </div>
      {console.log(community?.moderationFilters, "This is the moderation rule")}
      <AutoMod
        open={isAutoMod}
        onClose={() => setIsAutoMod(false)}
        filters={community?.moderationFilters}
        getCommunity={getCommunity}
      />
    </>
  );
}

export default Community;
