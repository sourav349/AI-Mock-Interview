"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import useSpeechToText from "react-hook-speech-to-text";
import { Mic, StopCircle } from "lucide-react";
import { toast } from "sonner";
import { chatSession } from "@/utils/GeminiAIModal";
import { db } from "@/utils/db";
import { UserAnswer } from "@/utils/schema";
import { useUser } from "@clerk/nextjs";
import moment from "moment";

const RecordAnswerSection = ({
  mockInterviewQuestion,
  activeQuestionIndex,
  interviewData,
}) => {
  const [userAnswer, setUserAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useUser();

  const {
    error,
    interimResult,
    isRecording,
    results,
    startSpeechToText,
    stopSpeechToText,
    setResults,
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false,
  });

  useEffect(() => {
    results.forEach((result) => {
      setUserAnswer((prev) => prev + " " + result.transcript);
    });
  }, [results]);

  useEffect(() => {
    if (!isRecording && userAnswer.trim().length > 10) {
      UpdateUserAnswer();
    }
  }, [userAnswer]);

  const handleRecording = () => {
    if (isRecording) {
      stopSpeechToText();
    } else {
      setUserAnswer("");
      setResults([]);
      startSpeechToText();
    }
  };

  const UpdateUserAnswer = async () => {
    setLoading(true);

    const questionText = mockInterviewQuestion[activeQuestionIndex]?.question;
    const prompt = `You are an AI interviewer. Here's the question: "${questionText}". The user answered: "${userAnswer}". Rate the answer from 1 to 10 and provide 2-3 sentences of constructive feedback. Return response in JSON format: { "rating": number, "feedback": string }.`;

    try {
      const result = await chatSession.sendMessage(prompt);
      const cleanText = result.response.text().replace(/```json|```/g, "");
      const feedbackJson = JSON.parse(cleanText);

      await db.insert(UserAnswer).values({
        mockIdRef: interviewData?.mockId,
        question: questionText,
        correctAns: mockInterviewQuestion[activeQuestionIndex]?.answer,
        userAns: userAnswer,
        feedback: feedbackJson?.feedback,
        rating: feedbackJson?.rating,
        userEmail: user?.primaryEmailAddress?.emailAddress,
        createdAt: moment().format("DD-MM-YYYY"),
      });

      toast.success("Answer recorded & feedback received!");
      setUserAnswer("");
      setResults([]);
    } catch (err) {
      console.error("Feedback parsing error:", err);
      toast.error("Failed to analyze the answer. Try again.");
    }

    setLoading(false);
  };

  if (error) {
    return (
      <div className="text-center text-red-500 mt-6">
        Web Speech API is not supported in your browser 🤷‍♂️
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center mt-10 px-4">
      <div className="relative rounded-2xl bg-black p-6 shadow-lg flex justify-center items-center w-full max-w-md">
        <Image
          src="/webcam.png"
          width={180}
          height={180}
          alt="Webcam Placeholder"
          className="opacity-40"
        />
        {/* Uncomment this to use actual webcam */}
        {/* <Webcam className="absolute h-full w-full rounded-lg z-10" mirrored /> */}
      </div>

      <Button
        disabled={loading}
        onClick={handleRecording}
        variant="outline"
        className={`mt-10 transition-all duration-300 ${
          isRecording ? "border-red-600 text-red-600" : ""
        }`}
      >
        {isRecording ? (
          <span className="flex items-center gap-2 animate-pulse">
            <StopCircle className="w-5 h-5" /> Stop Recording
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Mic className="w-5 h-5" /> Start Recording
          </span>
        )}
      </Button>

      <div className="mt-6 text-sm text-muted-foreground text-center max-w-xl">
        <p>
          {isRecording
            ? "Speak your answer clearly... recording in progress."
            : "Click the button to record your answer."}
        </p>
        {interimResult && (
          <p className="italic mt-2 text-blue-500">Heard: {interimResult}</p>
        )}
      </div>

      {userAnswer && !isRecording && (
        <div className="bg-muted p-4 rounded-xl shadow-md mt-6 w-full max-w-2xl">
          <h3 className="font-semibold mb-2 text-sm text-muted-foreground">
            Your Answer:
          </h3>
          <p className="text-sm">{userAnswer}</p>
        </div>
      )}
    </div>
  );
};

export default RecordAnswerSection;
