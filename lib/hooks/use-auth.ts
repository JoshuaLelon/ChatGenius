import { useAuth0 } from "@auth0/auth0-react"
import { useCallback } from "react"

export function useAuth() {
  const {
    isAuthenticated,
    isLoading,
    user,
    getAccessTokenSilently,
    loginWithRedirect,
    logout,
  } = useAuth0()

  const login = useCallback(() => {
    loginWithRedirect()
  }, [loginWithRedirect])

  const signOut = useCallback(() => {
    logout({ 
      logoutParams: {
        returnTo: window.location.origin 
      }
    })
  }, [logout])

  const getToken = useCallback(async () => {
    return await getAccessTokenSilently()
  }, [getAccessTokenSilently])

  return {
    isAuthenticated,
    isLoading,
    user,
    login,
    signOut,
    getToken,
  }
} 