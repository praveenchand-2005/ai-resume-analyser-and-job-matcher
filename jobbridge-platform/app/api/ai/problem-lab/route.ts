import { NextRequest,NextResponse } from "next/server";
import { getUserContext } from "../../../../lib/auth/require-user";
import { AIConfigurationError,AIProviderError,generateStructuredResponse } from "../../../../lib/ai/provider";
export const runtime="nodejs";

type PracticeProblem={
 title:string;statement:string;input_format:string;output_format:string;
 constraints:string[];examples:Array<{input:string;output:string;explanation:string}>;
 hints:string[];starter_code:string;reference_solution:string;solution_explanation:string;
 test_cases:Array<{input:string;expected_output:string}>;
 complexity:{time:string;space:string};
};
type CodeReview={
 score:number;verdict:string;summary:string;correctness_estimate:string;
 bugs:string[];edge_cases_missed:string[];complexity:{time:string;space:string};
 improvements:string[];improved_solution:string;tests_to_run:string[];
};

export async function POST(request:NextRequest){
 const ctx=await getUserContext();
 if(!ctx)return NextResponse.json({error:"Sign in to use the AI problem lab."},{status:401});
 const body=await request.json().catch(()=>null);
 if(!body||typeof body.action!=="string")return NextResponse.json({error:"Choose generate or review."},{status:400});
 try{
  if(body.action==="generate"){
   const topic=typeof body.topic==="string"?body.topic.slice(0,60):"Python";
   const role=typeof body.targetRole==="string"?body.targetRole.slice(0,120):"Fresher";
   const difficulty=["beginner","intermediate","advanced"].includes(body.difficulty)?body.difficulty:"beginner";
   const {data:problem,model}=await generateStructuredResponse<PracticeProblem>(
    "Create one original interview practice problem for an Indian fresher. Topic may be SQL, Python, DSA, Java, data analysis or data engineering. Make the statement unambiguous, include constraints, at least one worked example, progressive hints, starter code, a correct reference solution, an explanation, test cases and time/space complexity. Avoid copied company assessment questions. Return JSON fields title, statement, input_format, output_format, constraints[], examples[{input,output,explanation}], hints[], starter_code, reference_solution, solution_explanation, test_cases[{input,expected_output}], complexity{time,space}.",
    JSON.stringify({topic,target_role:role,difficulty}),2200
   );
   if(!problem.title||!problem.statement||!problem.reference_solution)return NextResponse.json({error:"The AI generated an incomplete problem. Retry."},{status:502});
   const {data:saved,error}=await ctx.supabase.from("practice_problems").insert({
    user_id:ctx.userId,topic,difficulty,target_role:role,problem,model_name:model
   }).select("id").single();
   if(error||!saved)return NextResponse.json({error:"Problem generated but could not be saved."},{status:500});
   return NextResponse.json({problemId:saved.id,problem});
  }
  if(body.action==="review"){
   const problemId=typeof body.problemId==="string"?body.problemId:"";
   const language=typeof body.language==="string"?body.language.slice(0,40):"Python";
   const code=typeof body.code==="string"?body.code.trim():"";
   if(!problemId||!code||code.length>16000)return NextResponse.json({error:"Choose a problem and submit code under 16,000 characters."},{status:400});
   const {data:savedProblem,error:problemError}=await ctx.supabase.from("practice_problems")
    .select("id,topic,difficulty,target_role,problem").eq("id",problemId).eq("user_id",ctx.userId).maybeSingle();
   if(problemError||!savedProblem)return NextResponse.json({error:"Practice problem not found."},{status:404});
   const {data:review,model}=await generateStructuredResponse<CodeReview>(
    "You are a careful code reviewer coaching a fresher. This is STATIC analysis only: do not claim you executed the code or ran tests. Compare the submission to the exact problem. Assess correctness, edge cases, reasoning and complexity. Give actionable feedback, tests the learner should run, and an improved solution only when useful. Never invent runtime results. Return JSON score (0-100), verdict, summary, correctness_estimate, bugs[], edge_cases_missed[], complexity{time,space}, improvements[], improved_solution, tests_to_run[].",
    JSON.stringify({problem:savedProblem.problem,topic:savedProblem.topic,difficulty:savedProblem.difficulty,language,submitted_code:code}),2200
   );
   const score=Math.max(0,Math.min(100,Math.round(Number(review.score)||0)));
   const {data:submission,error}=await ctx.supabase.from("problem_submissions").insert({
    user_id:ctx.userId,problem_id:problemId,language,code_text:code,score,feedback:review,model_name:model
   }).select("id").single();
   if(error||!submission)return NextResponse.json({error:"Review generated but could not be saved."},{status:500});
   return NextResponse.json({submissionId:submission.id,review:{...review,score},staticReviewOnly:true});
  }
  return NextResponse.json({error:"Unsupported problem-lab action."},{status:400});
 }catch(error){
  if(error instanceof AIConfigurationError)return NextResponse.json({error:error.message,code:"AI_NOT_CONFIGURED"},{status:503});
  if(error instanceof AIProviderError)return NextResponse.json({error:error.message},{status:502});
  return NextResponse.json({error:"Problem lab request failed. Retry."},{status:500});
 }
}
