"use client"

/**
 * DateTimePicker Component (Mobile Friendly)
 * 
 * Komponen untuk memilih tanggal dan waktu dengan tampilan elegan.
 * Menggunakan Popover di desktop dan Drawer di mobile.
 */

import * as React from "react"
import { CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
    DrawerFooter,
    DrawerClose,
} from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useIsMobile } from "@/hooks/use-mobile"

interface DateTimePickerProps {
    date: Date | undefined
    setDate: (date: Date | undefined) => void
    className?: string
    placeholder?: string
    showTime?: boolean
    timeOnly?: boolean
}

export function DateTimePicker({
    date,
    setDate,
    className,
    placeholder = "Pilih tanggal & waktu",
    showTime = true,
    timeOnly = false
}: DateTimePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [selectedDateTime, setSelectedDateTime] = React.useState<Date | undefined>(date)
    const isMobile = useIsMobile()
    const hoursRef = React.useRef<HTMLDivElement>(null)
    const minutesRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        setSelectedDateTime(date)
    }, [date])

    React.useEffect(() => {
        if (isOpen && !selectedDateTime) {
            const now = new Date()
            now.setSeconds(0)
            now.setMilliseconds(0)
            setSelectedDateTime(now)
        }
    }, [isOpen, selectedDateTime])

    React.useEffect(() => {
        if (isOpen && selectedDateTime) {
            const scrollToSelected = () => {
                const hourIndex = selectedDateTime.getHours()
                const minuteIndex = selectedDateTime.getMinutes()
                const buttonHeight = 32

                if (hoursRef.current) {
                    hoursRef.current.scrollTo({
                        top: hourIndex * buttonHeight - 80,
                        behavior: "smooth"
                    })
                }
                if (minutesRef.current) {
                    minutesRef.current.scrollTo({
                        top: minuteIndex * buttonHeight - 80,
                        behavior: "smooth"
                    })
                }
            }
            setTimeout(scrollToSelected, 100)
        }
    }, [isOpen, selectedDateTime])

    const hours = React.useMemo(() =>
        Array.from({ length: 24 }, (_, i) => i), [])

    const minutes = React.useMemo(() =>
        Array.from({ length: 60 }, (_, i) => i), [])

    const handleDateSelect = (day: Date | undefined) => {
        if (!day) {
            setSelectedDateTime(undefined)
            return
        }

        const newDate = new Date(day)
        if (selectedDateTime) {
            newDate.setHours(selectedDateTime.getHours())
            newDate.setMinutes(selectedDateTime.getMinutes())
        } else {
            const now = new Date()
            newDate.setHours(now.getHours())
            newDate.setMinutes(now.getMinutes())
        }

        setSelectedDateTime(newDate)
    }

    const handleTimeChange = (type: "hour" | "minute", value: number) => {
        const newDate = selectedDateTime ? new Date(selectedDateTime) : new Date()

        if (!selectedDateTime) {
            const today = new Date()
            newDate.setFullYear(today.getFullYear(), today.getMonth(), today.getDate())
        }

        if (type === "hour") {
            newDate.setHours(value)
        } else {
            newDate.setMinutes(value)
        }

        setSelectedDateTime(newDate)
    }

    const handleConfirm = () => {
        setDate(selectedDateTime)
        setIsOpen(false)
    }

    const handleClear = () => {
        setSelectedDateTime(undefined)
        setDate(undefined)
        setIsOpen(false)
    }

    const TriggerButton = (
        <Button
            variant="outline"
            className={cn(
                "w-full justify-start text-left font-normal",
                "hover:bg-accent/50 transition-colors duration-200",
                "border-input focus:ring-2 focus:ring-ring focus:ring-offset-2",
                !date && "text-muted-foreground",
                className
            )}
        >
            <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
            {date ? (
                <span className="font-medium">
                    {timeOnly
                        ? format(date, "HH:mm", { locale: id })
                        : format(date, showTime ? "EEE, d MMM yyyy HH:mm" : "EEE, d MMM yyyy", { locale: id })
                    }
                </span>
            ) : (
                <span>{placeholder}</span>
            )}
        </Button>
    )

    // Content untuk Mobile (layout vertikal)
    const MobileDateTimeContent = (
        <>
            <div className="flex flex-col">
                {!timeOnly && (
                    <>
                        <div className="p-3">
                            <Calendar
                                mode="single"
                                selected={selectedDateTime}
                                onSelect={handleDateSelect}
                                locale={id}
                                className="rounded-md mx-auto"
                                classNames={{
                                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                    day_today: "bg-accent text-accent-foreground font-bold",
                                }}
                            />
                        </div>
                        <Separator />
                    </>
                )}

                {(showTime || timeOnly) && (
                    <div className="flex flex-col p-4 bg-muted/30">
                        <div className="flex items-center gap-2 mb-3">
                            <Clock className="h-4 w-4 text-primary" />
                            <Label className="text-sm font-semibold">Waktu</Label>
                            <span className="ml-auto text-sm font-mono bg-primary/10 px-2 py-0.5 rounded text-primary">
                                {selectedDateTime ? format(selectedDateTime, "HH:mm") : "--:--"}
                            </span>
                        </div>

                        <div className="flex gap-2 flex-1">
                            <div className="flex-1 flex flex-col">
                                <Label className="text-xs text-center text-muted-foreground mb-2 font-medium">
                                    Jam
                                </Label>
                                <div
                                    ref={hoursRef}
                                    className="h-[150px] rounded-lg border bg-background overflow-y-auto overscroll-contain scrollbar-hide"
                                    style={{ touchAction: 'pan-y' }}
                                >
                                    <div className="p-1">
                                        {hours.map((hour) => (
                                            <Button
                                                key={hour}
                                                size="sm"
                                                variant={selectedDateTime?.getHours() === hour ? "default" : "ghost"}
                                                className={cn(
                                                    "w-full justify-center mb-0.5 font-mono transition-all duration-150",
                                                    selectedDateTime?.getHours() === hour &&
                                                    "shadow-md scale-105"
                                                )}
                                                onClick={() => handleTimeChange("hour", hour)}
                                            >
                                                {hour.toString().padStart(2, '0')}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col">
                                <Label className="text-xs text-center text-muted-foreground mb-2 font-medium">
                                    Menit
                                </Label>
                                <div
                                    ref={minutesRef}
                                    className="h-[150px] rounded-lg border bg-background overflow-y-auto overscroll-contain scrollbar-hide"
                                    style={{ touchAction: 'pan-y' }}
                                >
                                    <div className="p-1">
                                        {minutes.map((minute) => (
                                            <Button
                                                key={minute}
                                                size="sm"
                                                variant={selectedDateTime?.getMinutes() === minute ? "default" : "ghost"}
                                                className={cn(
                                                    "w-full justify-center mb-0.5 font-mono transition-all duration-150",
                                                    selectedDateTime?.getMinutes() === minute &&
                                                    "shadow-md scale-105"
                                                )}
                                                onClick={() => handleTimeChange("minute", minute)}
                                            >
                                                {minute.toString().padStart(2, '0')}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Separator />
            <div className="flex items-center justify-between p-3 bg-muted/20">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="text-muted-foreground hover:text-destructive"
                >
                    Hapus
                </Button>
                <Button
                    size="sm"
                    onClick={handleConfirm}
                    disabled={!selectedDateTime}
                    className="px-6"
                >
                    Konfirmasi
                </Button>
            </div>
        </>
    )

    // Content untuk Desktop (layout horizontal - calendar di kiri, time picker di kanan)
    const DesktopDateTimeContent = (
        <>
            <div className="flex flex-row">
                {!timeOnly && (
                    <div className="p-3">
                        <Calendar
                            mode="single"
                            selected={selectedDateTime}
                            onSelect={handleDateSelect}
                            locale={id}
                            className="rounded-md"
                            classNames={{
                                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                day_today: "bg-accent text-accent-foreground font-bold",
                            }}
                        />
                    </div>
                )}

                {(showTime || timeOnly) && (
                    <>
                        {!timeOnly && <Separator orientation="vertical" />}
                        <div className={cn("flex flex-col p-4 bg-muted/30", timeOnly ? "w-[240px]" : "w-[180px]")}>
                            <div className="flex items-center gap-2 mb-3">
                                <Clock className="h-4 w-4 text-primary" />
                                <Label className="text-sm font-semibold">Waktu</Label>
                                <span className="ml-auto text-sm font-mono bg-primary/10 px-2 py-0.5 rounded text-primary">
                                    {selectedDateTime ? format(selectedDateTime, "HH:mm") : "--:--"}
                                </span>
                            </div>

                            <div className="flex gap-2 flex-1">
                                <div className="flex-1 flex flex-col">
                                    <Label className="text-xs text-center text-muted-foreground mb-2 font-medium">
                                        Jam
                                    </Label>
                                    <div
                                        ref={hoursRef}
                                        className="h-[200px] rounded-lg border bg-background overflow-y-auto scrollbar-hide"
                                    >
                                        <div className="p-1">
                                            {hours.map((hour) => (
                                                <Button
                                                    key={hour}
                                                    size="sm"
                                                    variant={selectedDateTime?.getHours() === hour ? "default" : "ghost"}
                                                    className={cn(
                                                        "w-full justify-center mb-0.5 font-mono transition-all duration-150",
                                                        selectedDateTime?.getHours() === hour &&
                                                        "shadow-md scale-105"
                                                    )}
                                                    onClick={() => handleTimeChange("hour", hour)}
                                                >
                                                    {hour.toString().padStart(2, '0')}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col">
                                    <Label className="text-xs text-center text-muted-foreground mb-2 font-medium">
                                        Menit
                                    </Label>
                                    <div
                                        ref={minutesRef}
                                        className="h-[200px] rounded-lg border bg-background overflow-y-auto scrollbar-hide"
                                    >
                                        <div className="p-1">
                                            {minutes.map((minute) => (
                                                <Button
                                                    key={minute}
                                                    size="sm"
                                                    variant={selectedDateTime?.getMinutes() === minute ? "default" : "ghost"}
                                                    className={cn(
                                                        "w-full justify-center mb-0.5 font-mono transition-all duration-150",
                                                        selectedDateTime?.getMinutes() === minute &&
                                                        "shadow-md scale-105"
                                                    )}
                                                    onClick={() => handleTimeChange("minute", minute)}
                                                >
                                                    {minute.toString().padStart(2, '0')}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <Separator />
            <div className="flex items-center justify-between p-3 bg-muted/20">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="text-muted-foreground hover:text-destructive"
                >
                    Hapus
                </Button>
                <Button
                    size="sm"
                    onClick={handleConfirm}
                    disabled={!selectedDateTime}
                    className="px-6"
                >
                    Konfirmasi
                </Button>
            </div>
        </>
    )

    // Mobile: Use Drawer
    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={setIsOpen}>
                <DrawerTrigger asChild>
                    {TriggerButton}
                </DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle className="flex items-center gap-2 justify-center">
                            <CalendarIcon className="h-5 w-5 text-primary" />
                            Pilih Tanggal & Waktu
                        </DrawerTitle>
                    </DrawerHeader>
                    <div className="overflow-y-auto max-h-[70vh]">
                        {MobileDateTimeContent}
                    </div>
                </DrawerContent>
            </Drawer>
        )
    }

    // Desktop: Use Popover
    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                {TriggerButton}
            </PopoverTrigger>

            <PopoverContent
                className="w-auto p-0 shadow-xl border-border/50 backdrop-blur-sm"
                align="start"
                sideOffset={8}
                onWheel={(e) => e.stopPropagation()}
            >
                {DesktopDateTimeContent}
            </PopoverContent>
        </Popover>
    )
}
