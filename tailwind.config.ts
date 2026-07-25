/*
 * Copyright (c) 2026 EZBillify Ventures Pvt Ltd. All rights reserved.
 * Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).
 * 
 * WARNING & LIABILITY DISCLAIMER:
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * 
 * IMPORTANT: WHOEVER COPIES, REDISTRIBUTES, OR USES THIS SOFTWARE MUST KNOW THAT
 * UNDER NO CIRCUMSTANCES CAN THEY RECOVER DAMAGES, LOSSES, OR LIABILITIES
 * ENCOUNTERED FROM THE USE, MODIFICATION, OR DISTRIBUTION OF THIS SOFTWARE.
 */

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        /* ── shadcn/ui tokens (pure shadcn, no theme bridge) ─ */
        border:      "var(--border)",
        input:       "var(--input)",
        ring:        "var(--ring)",
        background:  "var(--background)",
        foreground:  "var(--foreground)",
        primary: {
          DEFAULT:     "var(--primary)",
          foreground:  "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT:     "var(--secondary)",
          foreground:  "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT:     "var(--destructive)",
          foreground:  "var(--destructive-foreground, var(--background))",
        },
        muted: {
          DEFAULT:     "var(--muted)",
          foreground:  "var(--muted-foreground)",
        },
        accent: {
          DEFAULT:     "var(--accent)",
          foreground:  "var(--accent-foreground)",
        },
        popover: {
          DEFAULT:     "var(--popover)",
          foreground:  "var(--popover-foreground)",
        },
        card: {
          DEFAULT:     "var(--card)",
          foreground:  "var(--card-foreground)",
        },
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        /* ── Legacy theme tokens (kept until *Legacy.tsx is gone) ── */
        theme: {
          page:    "hsl(var(--bg))",
          surface: "hsl(var(--surface))",
          raised:  "hsl(var(--surface-raised))",
          overlay: "hsl(var(--surface-overlay))",
          fg:      "hsl(var(--fg))",
          muted:   "hsl(var(--fg-muted))",
          subtle:  "hsl(var(--fg-subtle))",
          border:  "var(--border)",
          strong:  "hsl(var(--border-strong))",
          primary: "var(--primary)",
          ring:    "var(--ring)",
          input:   "hsl(var(--input-bg))",
          "input-border": "hsl(var(--input-border))",
          /* sidebar */
          "sidebar-bg":     "hsl(var(--sidebar-bg))",
          "sidebar-border": "var(--sidebar-border)",
          "sidebar-active": "hsl(var(--sidebar-active-bg))",
          "sidebar-active-fg": "hsl(var(--sidebar-active-fg))",
          "sidebar-hover":  "hsl(var(--sidebar-hover-bg))",
          /* semantic */
          "success-bg": "hsl(var(--success-bg))",
          "success-fg": "hsl(var(--success-fg))",
          "warning-bg": "hsl(var(--warning-bg))",
          "warning-fg": "hsl(var(--warning-fg))",
          "danger-bg":  "hsl(var(--danger-bg))",
          "danger-fg":  "hsl(var(--danger-fg))",
          "info-bg":    "hsl(var(--info-bg))",
          "info-fg":    "hsl(var(--info-fg))",
          "purple-bg":  "hsl(var(--purple-bg))",
          "purple-fg":  "hsl(var(--purple-fg))",
        },
        brand: {
          50:  "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
