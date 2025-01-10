import { dateDifference } from "@/utils";
import Image from "next/image";
import { useRouter } from "next/router";
import React from "react";

function CommunityCard({ community }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/${community._id}`)}
      className="w-full flex gap-2 cursor-pointer rounded-lg hover:bg-slate-200"
    >
      <Image
        className="object-cover bg-orange-200 border border-solid border-slate-200 rounded-lg h-[70px] w-[70px]"
        src={community.coverPicture?.url || "/assets/community.svg"}
        width={70}
        height={70}
        alt="community"
      />
      <div className="flex flex-col justify-center">
        <h2 className="font-semibold ">{community.name}</h2>
        <span className="text-sm">
          <span className="font-semibold">{community.members.length}</span>{" "}
          <span className="text-slate-600">
            Member
            {community.members.length === 1 ? "" : "s"}
          </span>
        </span>
        <span className="text-sm text-slate-600">
          Last active {dateDifference(community.updatedAt)} ago
        </span>
      </div>
    </div>
  );
}

export default CommunityCard;
