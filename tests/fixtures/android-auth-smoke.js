import React, { useState } from 'react'
import { AppRegistry, Button, Text, View } from 'react-native'
import { closeAuth, openAuth } from 'react-native-inappbrowser-nitro'

const AuthSmoke = () => {
  const [result, setResult] = useState('idle')

  const start = async (path = 'auth', cancel = false) => {
    setResult('pending')

    try {
      const authentication = openAuth(
        `http://10.0.2.2:8082/${path}`,
        'inappbrowsernitro://callback'
      )

      if (cancel) await closeAuth()

      const outcome = await authentication

      setResult(JSON.stringify(outcome))
    } catch (error) {
      setResult(String(error))
    }
  }

  return React.createElement(
    View,
    { style: { flex: 1, padding: 48, gap: 24 } },
    React.createElement(Button, {
      title: 'Start auth',
      onPress: () => void start(),
    }),
    React.createElement(Button, {
      title: 'Wrong redirect',
      onPress: () => void start('wrong'),
    }),
    React.createElement(Button, {
      title: 'Cancel auth',
      onPress: () => void start('auth', true),
    }),
    React.createElement(
      Text,
      { testID: 'auth-result', style: { fontSize: 20 } },
      result
    )
  )
}

AppRegistry.registerComponent('InappbrowserNitroExample', () => AuthSmoke)
