// src/app/(auth)/login.tsx
import { useAuth } from '@/contexts/authcontext';
import { ApiError } from '@/services/api';
import { useState } from 'react';
import {
    ActivityIndicator, KeyboardAvoidingView, Platform, Pressable,
    ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';

export default function Login() {
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';

  function switchMode() {
    setMode(isRegister ? 'login' : 'register');
    setError('');
  }

  async function handleSubmit() {
    if (submitting) return;
    setError('');

    if (!email.trim() || !password || (isRegister && !name.trim())) {
      setError('Preencha todos os campos.');
      return;
    }

    setSubmitting(true);
    try {
      if (isRegister) await signUp(name, email, password);
      else await signIn(email, password);
      // não precisa navegar: o (auth)/_layout redireciona quando o user é setado
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : isRegister ? 'Não foi possível criar a conta' : 'Não foi possível fazer login',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: 'transparent' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={[styles.scroll, { backgroundColor: 'transparent' }]} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>Soundy</Text>

        <View style={styles.card}>
          <Text style={styles.title}>{isRegister ? 'Criar conta' : 'Entrar'}</Text>

          {isRegister && (
            <TextInput
              style={styles.input}
              placeholder="Nome"
              placeholderTextColor="#aaa"
              value={name}
              onChangeText={setName}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor="#aaa"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor="#aaa"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleSubmit}
          />

          <Pressable
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{isRegister ? 'Criar conta' : 'Entrar'}</Text>
            )}
          </Pressable>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <Pressable onPress={switchMode}>
            <Text style={styles.switch}>
              {isRegister ? 'Já tem uma conta? ' : 'Não tem uma conta? '}
              <Text style={styles.switchLink}>{isRegister ? 'Entrar' : 'Criar conta'}</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// cores tiradas do style.css do site (#5E052C de fundo, #b91d92 de destaque)
const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 24 },
  brand: { color: '#fff', fontSize: 40, fontWeight: 'bold', textAlign: 'center' },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 20,
    gap: 12,
  },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
  },
  button: { backgroundColor: '#b91d92', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  error: { color: '#ff7b9c', textAlign: 'center' },
  switch: { color: '#ddd', textAlign: 'center', marginTop: 4 },
  switchLink: { color: '#e04bc0', fontWeight: 'bold' },
});