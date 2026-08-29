import { redirect } from 'next/navigation'

// TEMP: once real auth exists, check if the user is logged in here.
// Logged in -> redirect('/feed'). Not logged in -> redirect('/welcome').
// For now, everyone always lands on the Welcome screen first.
export default function RootPage() {
  redirect('/welcome')
}
