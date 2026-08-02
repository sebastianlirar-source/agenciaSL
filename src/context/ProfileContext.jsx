import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './AuthContext'

const ProfileContext = createContext(undefined)

export function ProfileProvider({ children }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [mySports, setMySports] = useState([])
  const [loadingProfile, setLoadingProfile] = useState(true)

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setMySports([])
      setLoadingProfile(false)
      return
    }
    setLoadingProfile(true)

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    setProfile(profileData ?? null)

    if (profileData) {
      const { data: sportsData } = await supabase
        .from('user_sports')
        .select('sport_id, nivel, sports ( id, nombre )')
        .eq('user_id', user.id)
      setMySports(sportsData ?? [])
    } else {
      setMySports([])
    }

    setLoadingProfile(false)
  }, [user])

  useEffect(() => {
    refreshProfile()
  }, [refreshProfile])

  const value = {
    profile,
    mySports,
    loadingProfile,
    refreshProfile,
    profileComplete: Boolean(profile && mySports.length > 0),
  }

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (ctx === undefined) throw new Error('useProfile debe usarse dentro de <ProfileProvider>')
  return ctx
}
