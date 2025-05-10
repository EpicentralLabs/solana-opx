'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'
import * as React from 'react'
import {ReactNode, Suspense, useEffect, useRef} from 'react'
import toast, {Toaster} from 'react-hot-toast'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'
import { useCluster } from '../solana/cluster/cluster-data-access'
import {ClusterChecker, ClusterUiSelect, ExplorerLink} from '../solana/cluster/cluster-ui'
import {WalletButton} from '../solana/solana-provider'
import {WalletBalanceLogger} from '../solana/wallet/wallet-balance'

export function UiLayout({ children, links }: { children: ReactNode; links: { label: string; path: string }[] }) {
  const pathname = usePathname()
  const { resolvedTheme, theme, systemTheme } = useTheme()
  const { cluster } = useCluster()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Always use the dark theme logo
  const logoSrc = '/epicentral-logo-light.png'

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-4 max-w-7xl mx-auto">
          <div className="w-[200px]">
            <Link href="/" className="block transition-transform hover:scale-105 duration-200">
              {mounted ? (
                <Image 
                  src={logoSrc}
                  alt="Epicentral Labs Logo"
                  width={120}
                  height={35}
                  className="h-[35px] w-auto object-contain"
                  priority
                  onError={(e) => {
                    console.error('Error loading image:', e);
                  }}
                />
              ) : (
                <div className="h-[35px] w-[120px]" />
              )}
            </Link>
          </div>
          <div className="flex-1 flex justify-center">
            <nav className="flex items-center gap-8">
              {links.map(({ label, path }) => (
                <Link
                  key={path}
                  href={path}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname.startsWith(path) ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="w-[200px] flex justify-end items-center space-x-4">
            <WalletButton />
            <ClusterUiSelect />
          </div>
        </div>
      </div>
      <ClusterChecker>
        <WalletBalanceLogger />
      </ClusterChecker>
      <main className="container mx-auto py-6">
        <Suspense
          fallback={
            <div className="flex justify-center my-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          }
        >
          {children}
        </Suspense>
        <Toaster position="bottom-right" />
      </main>
      <footer className="py-4 text-center text-sm">
        <span className="text-[#4a85ff]">
          © 2025 Epicentral Labs || Powered by{' '}
          <a 
            href="https://solana.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:opacity-80"
          >
            Solana
          </a>
        </span>
      </footer>
    </div>
  )
}

export function AppModal({
  children,
  title,
  hide,
  show,
  submit,
  submitDisabled,
  submitLabel,
}: {
  children: ReactNode
  title: string
  hide: () => void
  show: boolean
  submit?: () => void
  submitDisabled?: boolean
  submitLabel?: string
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  useEffect(() => {
    if (!dialogRef.current) return
    if (show) {
      dialogRef.current.showModal()
    } else {
      dialogRef.current.close()
    }
  }, [show, dialogRef])

  return (
    <dialog className="modal" ref={dialogRef}>
      <div className="modal-box space-y-5">
        <h3 className="font-bold text-lg">{title}</h3>
        {children}
        <div className="modal-action">
          <div className="join space-x-2">
            {submit ? (
              <button className="btn btn-xs lg:btn-md btn-primary" onClick={submit} disabled={submitDisabled}>
                {submitLabel || 'Save'}
              </button>
            ) : null}
            <button onClick={hide} className="btn">
              Close
            </button>
          </div>
        </div>
      </div>
    </dialog>
  )
}

export function AppHero({
  children,
  title,
  subtitle,
}: {
  children?: ReactNode
  title: ReactNode
  subtitle: ReactNode
}) {
  return (
    <div className="hero py-[64px]">
      <div className="hero-content text-center">
        <div className="max-w-2xl">
          {typeof title === 'string' ? <h1 className="text-5xl font-bold">{title}</h1> : title}
          {typeof subtitle === 'string' ? <p className="py-6">{subtitle}</p> : subtitle}
          {children}
        </div>
      </div>
    </div>
  )
}

export function ellipsify(str = '', len = 4) {
  if (str.length > 30) {
    return str.substring(0, len) + '..' + str.substring(str.length - len, str.length)
  }
  return str
}

export function useTransactionToast() {
  return (signature: string) => {
    toast.success(
      <div className={'text-center'}>
        <div className="text-lg">Transaction sent</div>
        <ExplorerLink path={`tx/${signature}`} label={'View Transaction'} className="btn btn-xs btn-primary" />
      </div>,
    )
  }
}
