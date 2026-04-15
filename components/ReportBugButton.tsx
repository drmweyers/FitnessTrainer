'use client'

import { useState, useRef } from 'react'
import { Bug, CheckCircle, AlertCircle, Loader2, Paperclip } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

const CATEGORIES = [
  { value: 'ui_issue', label: 'UI Issue' },
  { value: 'data_accuracy', label: 'Data Accuracy' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'performance', label: 'Performance' },
  { value: 'sync_issue', label: 'Sync Issue' },
  { value: 'auth_access', label: 'Auth / Access' },
  { value: 'notification', label: 'Notification' },
  { value: 'integration', label: 'Integration' },
  { value: 'crash', label: 'Crash / Error' },
  { value: 'other', label: 'Other' },
] as const

type Category = (typeof CATEGORIES)[number]['value']

interface FormState {
  category: Category | ''
  description: string
  screenshotBase64: string | null
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

export default function ReportBugButton() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>({
    category: '',
    description: '',
    screenshotBase64: null,
  })
  const [errors, setErrors] = useState<{ category?: string; description?: string }>({})
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!user) return null

  const resetForm = () => {
    setForm({ category: '', description: '', screenshotBase64: null })
    setErrors({})
    setSubmitState('idle')
    setErrorMessage('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const maxDim = 1200
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width)
          width = maxDim
        } else {
          width = Math.round((width * maxDim) / height)
          height = maxDim
        }
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0, width, height)
      setForm((prev) => ({ ...prev, screenshotBase64: canvas.toDataURL('image/jpeg', 0.6) }))
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  const validate = (): boolean => {
    const newErrors: typeof errors = {}
    if (!form.category) newErrors.category = 'Please select a category'
    if (form.description.trim().length < 10) {
      newErrors.description = 'Please provide at least 10 characters'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitState('submitting')
    const token = localStorage.getItem('accessToken')

    try {
      const res = await fetch('/api/bugs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          category: form.category,
          description: form.description.trim(),
          screenshotBase64: form.screenshotBase64,
          context: {
            url: window.location.pathname,
            browser: navigator.userAgent.split(' ').slice(-1)[0] ?? 'Unknown',
            userAgent: navigator.userAgent,
            userRole: user.role,
            userId: user.id,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(
          typeof data.message === 'string' ? data.message
          : typeof data.error === 'string' ? data.error
          : 'Submission failed — please try again'
        )
      }

      // Show success screen inside the dialog, then auto-close after 2.5s
      setSubmitState('success')
      setTimeout(() => {
        setOpen(false)
        resetForm()
      }, 2500)
    } catch (err) {
      setSubmitState('error')
      setErrorMessage(err instanceof Error ? err.message : 'Submission failed — please try again')
    }
  }

  const handleOpenChange = (val: boolean) => {
    setOpen(val)
    if (!val) resetForm()
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Report a Problem"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-full shadow-lg transition-colors text-sm font-medium"
      >
        <Bug size={16} />
        <span className="hidden sm:inline">Report a Problem</span>
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">

          {/* Success screen */}
          {submitState === 'success' ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
              <CheckCircle size={48} className="text-green-500" />
              <div>
                <p className="text-lg font-semibold text-gray-900">Report submitted!</p>
                <p className="text-sm text-gray-500 mt-1">
                  Thank you — we'll look into it shortly.
                </p>
              </div>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-gray-900">
                  <Bug size={18} className="text-orange-500" />
                  Report a Problem
                </DialogTitle>
              </DialogHeader>

              {/* Inline error banner */}
              {submitState === 'error' && (
                <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                {/* Category */}
                <div className="space-y-1.5">
                  <Label htmlFor="bug-category">Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(val: string) => {
                      setErrors((prev) => ({ ...prev, category: undefined }))
                      setForm((prev) => ({ ...prev, category: val as Category }))
                    }}
                  >
                    <SelectTrigger id="bug-category" aria-label="Category">
                      <SelectValue placeholder="Select a category…" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-red-500 text-xs">{errors.category}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label htmlFor="bug-description">Description</Label>
                  <Textarea
                    id="bug-description"
                    placeholder="Describe the issue in detail…"
                    rows={5}
                    value={form.description}
                    onChange={(e) => {
                      setErrors((prev) => ({ ...prev, description: undefined }))
                      setForm((prev) => ({ ...prev, description: e.target.value }))
                    }}
                    maxLength={5000}
                  />
                  {errors.description && (
                    <p className="text-red-500 text-xs">{errors.description}</p>
                  )}
                  <p className="text-gray-400 text-xs text-right">
                    {form.description.length}/5000
                  </p>
                </div>

                {/* Screenshot */}
                <div className="space-y-1.5">
                  <Label>Screenshot (optional)</Label>
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      aria-label="Attach screenshot"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5"
                    >
                      <Paperclip size={14} />
                      Attach Screenshot
                    </Button>
                    {form.screenshotBase64 && (
                      <span className="text-xs text-green-600 font-medium">
                        Screenshot attached
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    disabled={submitState === 'submitting'}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitState === 'submitting'}
                    className="bg-orange-500 hover:bg-orange-600 text-white min-w-[120px]"
                  >
                    {submitState === 'submitting' ? (
                      <>
                        <Loader2 size={14} className="animate-spin mr-1.5" />
                        Submitting…
                      </>
                    ) : (
                      'Submit Report'
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}

        </DialogContent>
      </Dialog>
    </>
  )
}
