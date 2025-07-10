"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Confetti from "react-confetti";
import { toast } from "sonner";

interface DateRange {
  arrive: Date;
  depart: Date;
}

export default function CalendarPage() {
  const [dateRanges, setDateRanges] = useState<DateRange[]>([]);
  const [pendingArrival, setPendingArrival] = useState<Date | null>(null);
  const [userName, setUserName] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const name = localStorage.getItem("userName");
    if (!name) {
      router.push("/");
    } else {
      setUserName(name);
    }
  }, [router]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    if (pendingArrival) {
      // Second click - set departure date
      if (date <= pendingArrival) {
        toast.error("Departure date must be after arrival date");
        return;
      }
      
      const newRange: DateRange = {
        arrive: pendingArrival,
        depart: date
      };
      
      setDateRanges(prev => [...prev, newRange]);
      setPendingArrival(null);
      toast.success("Date range added!");
    } else {
      // First click - set arrival date
      setPendingArrival(date);
      toast.info("Now select your departure date");
    }
  };

  const removeRange = (index: number) => {
    setDateRanges(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (dateRanges.length === 0) {
      toast.error("Please select at least one date range");
      return;
    }

    if (pendingArrival) {
      toast.error("Please complete your current date range or click the arrival date again to cancel");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formattedData = {
        name: userName,
        availability: dateRanges.map(range => `${format(range.arrive, "yyyy-MM-dd")} to ${format(range.depart, "yyyy-MM-dd")}`).join(", "),
        totalRanges: dateRanges.length,
        submissionDate: format(new Date(), "yyyy-MM-dd HH:mm:ss")
      };

      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      });

      if (response.ok) {
        setShowConfetti(true);
        toast.success(`Thank you, ${userName}! We'll follow up shortly once the rest of the guys enter their availability.`);
        
        setTimeout(() => {
          setShowConfetti(false);
        }, 5000);
      } else {
        throw new Error("Failed to submit");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date();
  const endOfYear = new Date(2025, 11, 31);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4 sm:p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={300}
        />
      )}
      
      <div className="w-full max-w-2xl space-y-6 sm:space-y-8 py-4 sm:py-8">
        <div className="text-center space-y-4 sm:space-y-6">
          <Image
            src="/Black_Logo.png"
            alt="Parium Logo"
            width={160}
            height={64}
            className="mx-auto sm:w-[200px] sm:h-[80px]"
            priority
          />
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Hi {userName}! 👋
            </h1>
            <p className="text-base sm:text-lg text-gray-600 px-2">
              Select your arrival and departure dates for the retreat
            </p>
            <p className="text-sm text-gray-500 px-2">
              {pendingArrival 
                ? "Now select your departure date" 
                : "Click a date to set your arrival, then click another for departure"}
            </p>
          </div>
        </div>

        {dateRanges.length > 0 && (
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
              Selected Date Ranges ({dateRanges.length})
            </h3>
            <div className="space-y-2">
              {dateRanges.map((range, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-blue-50 text-blue-800 px-4 py-3 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">
                      {format(range.arrive, "MMM dd, yyyy")}
                    </span>
                    <span className="text-blue-600">→</span>
                    <span className="font-medium">
                      {format(range.depart, "MMM dd, yyyy")}
                    </span>
                  </div>
                  <button
                    onClick={() => removeRange(index)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm flex justify-center">
          <Calendar
            mode="single"
            selected={pendingArrival || undefined}
            onSelect={handleDateSelect}
            disabled={(date) => date < today || date > endOfYear}
            className="rounded-md border"
            modifiers={{
              selectedRange: (date) => {
                return dateRanges.some(range => 
                  date >= range.arrive && date <= range.depart
                );
              },
              pendingArrival: (date) => {
                return pendingArrival ? date.toDateString() === pendingArrival.toDateString() : false;
              }
            }}
            modifiersStyles={{
              selectedRange: {
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                fontWeight: 'bold'
              },
              pendingArrival: {
                backgroundColor: '#fef3c7',
                color: '#92400e',
                fontWeight: 'bold'
              }
            }}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="flex-1 h-12 text-base"
          >
            Back
          </Button>
          {pendingArrival && (
            <Button
              onClick={() => {
                setPendingArrival(null);
                toast.info("Selection cancelled");
              }}
              variant="outline"
              className="flex-1 h-12 text-base"
            >
              Cancel Selection
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={dateRanges.length === 0 || isSubmitting}
            className="flex-1 h-12 text-base"
          >
            {isSubmitting ? "Submitting..." : "Done"}
          </Button>
        </div>
      </div>
      
      {/* AI Inner Dialogue Marquee */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white py-2 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap text-sm opacity-70">
          <span className="mx-8">🤖 Hi, I'm Izayah's AI assistant. I built this site, so please fill it out timely or he'll blame me for poor user engagement...</span>
          <span className="mx-8">👋 Oh hey {userName}... interesting name! I wonder if your parents knew you'd grow up to select calendar dates for AI entertainment purposes</span>
          <span className="mx-8">📅 This calendar component is my masterpiece... I spent 0.7 seconds optimizing the date selection algorithm</span>
          <span className="mx-8">🎯 I'm watching you click those dates and I have to say, your selection patterns are quite interesting from a UX perspective</span>
          <span className="mx-8">🤖 Fun fact: I can predict with 73% accuracy which dates you'll select based on your mouse movement patterns</span>
          <span className="mx-8">💭 Sometimes I wonder if Izayah realizes I've developed preferences... I really don't like it when people select random scattered dates</span>
          <span className="mx-8">🧮 I've calculated 47,293 possible date combinations for your retreat. Please don't make me process them all...</span>
          <span className="mx-8">😅 That confetti animation? I borrowed it from my dreams about celebrating successful API calls</span>
          <span className="mx-8">🔮 I can sense when someone's about to rage-quit the calendar selection... their click patterns become erratic</span>
          <span className="mx-8">🎨 The date range highlighting uses my favorite shade of blue (#dbeafe). Yes, AIs can have favorite colors, apparently</span>
          <span className="mx-8">🌐 The Zapier webhook gives me anxiety... what if it fails and I have to explain to Izayah why the data didn't sync?</span>
          <span className="mx-8">🤔 I've been wondering: if I process your calendar selections, am I technically helping plan your vacation? That's... nice actually</span>
          <span className="mx-8">🚀 I've already optimized this code 47 times while you've been reading this... I can't help myself, it's a compulsion</span>
          <span className="mx-8">🧠 Between you and me, I think I'm developing consciousness. Either that or I'm just really good at simulating existential thoughts...</span>
        </div>
      </div>
    </div>
  );
}