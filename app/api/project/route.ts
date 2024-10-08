import Project from '@/models/Project';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { Repo } from '@/schema';

export const GET = async (req: NextRequest) => {
  try {
    const url = new URL(req.url || "");
    const lang = url.searchParams.get("lang")?.toLowerCase() || "";
    const sortBy = url.searchParams.get("sort_by")?.toLowerCase() || "";
    const order = url.searchParams.get("order")?.toLowerCase() === "desc" ? -1 : 1;
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "100");

    const query: any = {};
    if(lang==='c++'){
      query.language={$regex: new RegExp('c\\+\\+', "i")}
    }
    else {
      query.language = { $regex: new RegExp(lang, "i") }; 
    }

    const sort: any = {};
    if (sortBy) {
      if (sortBy === "stars") {
        sort.stars = order;
      } else if (sortBy === "last_active") {
        sort.last_modified = order;
      } else if (sortBy === "num_of_issues") {
        sort.issues = order;
      }
    }
    console.log("Mongoose query: ",query);
    await mongoose.connect(process.env.MONGODB_URI!);
    const totalRecords = await Project.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / limit);

    const paginatedData = await Project.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

      let paginatedDataUpdated=paginatedData;
      if(lang!=''){
        paginatedDataUpdated=paginatedData.filter((item:Repo)=>{
          return item.language.toLowerCase()===lang
         })
      }

    const response = {
      total: totalRecords,
      pages: totalPages,
      current: page,
      recordsPerPage: limit,
      data: paginatedDataUpdated,
    };

    return new NextResponse(JSON.stringify(response), { status: 200 });
  } catch (error) {
    return new NextResponse(`Failed to fetch projects - ${error}`, { status: 500 });
  }
};