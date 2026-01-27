"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Send, Star, Upload, X, FileText } from "lucide-react";
import { submitResponse } from "@/lib/actions/responses";
import type { Form, Question } from "@/lib/db/schema";

interface FormFillerProps {
  form: Form & { questions: Question[] };
}

type AnswerValue = string | string[] | null;

export function FormFiller({ form }: FormFillerProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});

  const updateAnswer = (questionId: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleCheckboxChange = (questionId: string, option: string, checked: boolean) => {
    const current = (answers[questionId] as string[]) || [];
    if (checked) {
      updateAnswer(questionId, [...current, option]);
    } else {
      updateAnswer(questionId, current.filter((o) => o !== option));
    }
  };

  const handleFileUpload = async (questionId: string, file: File) => {
    setUploadingFiles((prev) => ({ ...prev, [questionId]: true }));
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();
      setFileUrls((prev) => ({ ...prev, [questionId]: data.url }));
      toast.success("File berhasil diupload");
    } catch (error: any) {
      toast.error(error.message || "Gagal mengupload file");
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const removeFile = (questionId: string) => {
    setFileUrls((prev) => {
      const { [questionId]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // Validate required fields
      for (const question of form.questions) {
        if (question.required) {
          const answer = answers[question.id];
          const fileUrl = fileUrls[question.id];
          
          if (question.type === "file_upload") {
            if (!fileUrl) {
              toast.error(`Pertanyaan "${question.label}" wajib diisi`);
              setIsLoading(false);
              return;
            }
          } else if (question.type === "checkboxes") {
            if (!answer || (Array.isArray(answer) && answer.length === 0)) {
              toast.error(`Pertanyaan "${question.label}" wajib diisi`);
              setIsLoading(false);
              return;
            }
          } else {
            if (!answer) {
              toast.error(`Pertanyaan "${question.label}" wajib diisi`);
              setIsLoading(false);
              return;
            }
          }
        }
      }

      const answerPayload = form.questions.map((question) => {
        const answer = answers[question.id];
        const fileUrl = fileUrls[question.id];

        let value: string | null = null;
        if (question.type === "checkboxes" && Array.isArray(answer)) {
          value = JSON.stringify(answer);
        } else if (typeof answer === "string") {
          value = answer;
        }

        return {
          questionId: question.id,
          value,
          fileUrl: fileUrl || null,
        };
      });

      await submitResponse({
        formId: form.id,
        answers: answerPayload,
      });

      toast.success("Form berhasil dikirim");
      router.push("/my-responses");
    } catch (error: any) {
      toast.error(error.message || "Gagal mengirim form");
    } finally {
      setIsLoading(false);
    }
  };

  const renderQuestion = (question: Question, index: number) => {
    return (
      <Card key={question.id}>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {index + 1}
            </span>
            <div className="flex-1">
              <CardTitle className="text-base font-medium">
                {question.label}
                {question.required && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </CardTitle>
              {question.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {question.description}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderInput(question)}
        </CardContent>
      </Card>
    );
  };

  const renderInput = (question: Question) => {
    switch (question.type) {
      case "short_text":
        return (
          <Input
            placeholder="Ketik jawaban Anda"
            value={(answers[question.id] as string) || ""}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
          />
        );

      case "paragraph":
        return (
          <Textarea
            placeholder="Ketik jawaban Anda"
            rows={4}
            value={(answers[question.id] as string) || ""}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
          />
        );

      case "multiple_choice":
        return (
          <RadioGroup
            value={(answers[question.id] as string) || ""}
            onValueChange={(value) => updateAnswer(question.id, value)}
          >
            {question.options?.map((option, i) => (
              <div key={i} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${i}`} />
                <Label htmlFor={`${question.id}-${i}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "checkboxes":
        const checkedValues = (answers[question.id] as string[]) || [];
        return (
          <div className="space-y-2">
            {question.options?.map((option, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${i}`}
                  checked={checkedValues.includes(option)}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange(question.id, option, !!checked)
                  }
                />
                <Label htmlFor={`${question.id}-${i}`}>{option}</Label>
              </div>
            ))}
          </div>
        );

      case "dropdown":
        return (
          <Select
            value={(answers[question.id] as string) || ""}
            onValueChange={(value) => updateAnswer(question.id, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih jawaban" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option, i) => (
                <SelectItem key={i} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "date":
        return (
          <Input
            type="date"
            value={(answers[question.id] as string) || ""}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
          />
        );

      case "time":
        return (
          <Input
            type="time"
            value={(answers[question.id] as string) || ""}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
          />
        );

      case "file_upload":
        const fileUrl = fileUrls[question.id];
        const isUploading = uploadingFiles[question.id];
        return (
          <div className="space-y-2">
            {fileUrl ? (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <FileText className="h-4 w-4" />
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex-1"
                >
                  File telah diupload
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(question.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  disabled={isUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(question.id, file);
                    }
                  }}
                />
                {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Maksimal 10MB. Format: JPG, PNG, PDF, DOC, DOCX, XLS, XLSX
            </p>
          </div>
        );

      case "linear_scale":
        const min = question.scaleMin || 1;
        const max = question.scaleMax || 5;
        const currentScale = answers[question.id] as string;
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{question.scaleMinLabel || min}</span>
              <span>{question.scaleMaxLabel || max}</span>
            </div>
            <div className="flex justify-between gap-2">
              {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={currentScale === value.toString() ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => updateAnswer(question.id, value.toString())}
                >
                  {value}
                </Button>
              ))}
            </div>
          </div>
        );

      case "rating":
        const ratingMax = question.ratingMax || 5;
        const currentRating = parseInt((answers[question.id] as string) || "0");
        return (
          <div className="flex items-center gap-1">
            {Array.from({ length: ratingMax }, (_, i) => i + 1).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => updateAnswer(question.id, value.toString())}
                className="p-1 hover:scale-110 transition-transform"
              >
                <Star
                  className={`h-8 w-8 ${
                    value <= currentRating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
            {currentRating > 0 && (
              <span className="ml-2 text-sm text-muted-foreground">
                {currentRating}/{ratingMax}
              </span>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {form.questions.map((question, index) => renderQuestion(question, index))}

      <div className="flex justify-end pt-4">
        <Button onClick={handleSubmit} disabled={isLoading} size="lg">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Send className="mr-2 h-4 w-4" />
          Kirim Jawaban
        </Button>
      </div>
    </div>
  );
}
