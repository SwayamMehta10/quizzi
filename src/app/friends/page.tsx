import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FaUserFriends } from "react-icons/fa";
import { FaUsersViewfinder } from "react-icons/fa6";
import { MdPending } from "react-icons/md";

export default function Friends() {
  return (
    <div className="container py-12 md:py-8">
      <h1 className="text-3xl font-extrabold tracking-tight mb-6">Friends</h1>
      <Tabs defaultValue="popular" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-3 mb-6 bg-background border">
            <TabsTrigger value="popular" className="data-[state=active]:bg-primary data-[state=active]:text-white"><FaUsersViewfinder className="text-primary"/>Find</TabsTrigger>
            <TabsTrigger value="trending" className="data-[state=active]:bg-primary data-[state=active]:text-white"><MdPending className="text-primary"/>Requests</TabsTrigger>
            <TabsTrigger value="new" className="data-[state=active]:bg-primary data-[state=active]:text-white"><FaUserFriends className="text-primary"/>Friends</TabsTrigger>
          </TabsList>
		  
	  </Tabs>
	</div>
  );
}