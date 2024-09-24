/*
  Iniciei a tarefa dia 23/09 devido a urgências no meu trabalho e a necessidade de entregar
  outros trabalhos da faculdade. Por isso, a falta de componentização e estilização apropriada
  para a experiência do usuário.
*/

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Person {
  name: string;
  value: number;
  isFixed: boolean;
}

interface Bill {
  id: string;
  billName: string;
  people: Person[];
  total: number;
}

export default function App() {
  const [billName, setBillName] = useState('');
  const [total, setTotal] = useState<number | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [personName, setPersonName] = useState('');
  const [logs, setLogs] = useState<Bill[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  useEffect(() => {
    loadLogs();
  }, []);

  const addPerson = () => {
    if (personName === '') {
      Alert.alert('Erro', 'Nome da pessoa não pode estar vazio.');
      return;
    }
    setPeople([...people, { name: personName, value: 0, isFixed: false }]);
    setPersonName('');
  };

  const calculateSplit = () => {
    if (total === null || people.length === 0) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    let fixedPeople = people.filter((p) => p.isFixed);
    let nonFixedPeople = people.filter((p) => !p.isFixed);

    let remainingAmount =
      total - fixedPeople.reduce((sum, p) => sum + p.value, 0);
    let splitValue = remainingAmount / nonFixedPeople.length;

    let updatedPeople = people.map((p) =>
      p.isFixed ? p : { ...p, value: splitValue }
    );

    setPeople(updatedPeople);
  };

  const markAsFixed = (index: number) => {
    let updatedPeople = [...people];
    updatedPeople[index].isFixed = !updatedPeople[index].isFixed;
    setPeople(updatedPeople);
  };

  const editPersonValue = (index: number) => {
    setEditingIndex(index);
    setEditingValue(people[index].value.toString());
  };

  const savePersonValue = () => {
    if (editingIndex === null || editingValue === '') return;

    let updatedPeople = [...people];
    let newValue = parseFloat(editingValue);

    if (isNaN(newValue)) {
      Alert.alert('Erro', 'Digite um valor válido.');
      return;
    }

    updatedPeople[editingIndex].value = newValue;
    updatedPeople[editingIndex].isFixed = true;
    setPeople(updatedPeople);

    setEditingIndex(null);
    setEditingValue('');

    calculateSplit();
  };

  const saveBill = async () => {
    if (billName === '' || total === null || people.length === 0) {
      Alert.alert('Erro', 'Preencha todos os campos antes de salvar.');
      return;
    }

    const newBill: Bill = {
      id: Date.now().toString(),
      billName,
      people,
      total: total || 0,
    };

    const updatedLogs = [...logs, newBill];
    setLogs(updatedLogs);
    await AsyncStorage.setItem('logs', JSON.stringify(updatedLogs));
    setBillName('');
    setTotal(null);
    setPeople([]);
  };

  const loadLogs = async () => {
    const storedLogs = await AsyncStorage.getItem('logs');
    if (storedLogs) {
      setLogs(JSON.parse(storedLogs));
    }
  };

  const clearLogs = async () => {
    await AsyncStorage.removeItem('logs');
    setLogs([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calculadora de Divisão de Contas</Text>

      <TextInput
        style={styles.input}
        placeholder='Nome da conta'
        value={billName}
        onChangeText={setBillName}
      />

      <TextInput
        style={styles.input}
        placeholder='Valor total da conta'
        keyboardType='numeric'
        value={total ? total.toString() : ''}
        onChangeText={(text) => setTotal(Number(text))}
      />

      <TextInput
        style={styles.input}
        placeholder='Nome da pessoa'
        value={personName}
        onChangeText={setPersonName}
      />
      <Button title='Adicionar Pessoa' onPress={addPerson} />

      <FlatList
        data={people}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.personRow}>
            <TouchableOpacity onPress={() => editPersonValue(index)}>
              <Text>
                {item.name}: R$ {item.value.toFixed(2)}
              </Text>
            </TouchableOpacity>
            <Button
              title={item.isFixed ? 'Desmarcar' : 'Fixar Valor'}
              onPress={() => markAsFixed(index)}
            />
          </View>
        )}
      />

      {editingIndex !== null && (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.input}
            placeholder='Novo valor'
            keyboardType='numeric'
            value={editingValue}
            onChangeText={setEditingValue}
          />
          <Button title='Salvar Valor' onPress={savePersonValue} />
        </View>
      )}

      <Button title='Calcular Divisão' onPress={calculateSplit} />
      <Button title='Salvar Conta' onPress={saveBill} />
      <Button title='Limpar Histórico' onPress={clearLogs} />

      <Text style={styles.subtitle}>Histórico de Contas</Text>
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.logItem}>
            <Text>Conta: {item.billName}</Text>
            <Text>Total: R$ {item.total.toFixed(2)}</Text>
            {item.people.map((p, i) => (
              <Text key={i}>
                {p.name}: R$ {p.value.toFixed(2)}
              </Text>
            ))}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f8ff',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    height: 40,
    borderColor: '#4682b4',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  personRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  personText: {
    fontSize: 16,
    color: '#555',
  },
  editContainer: {
    marginBottom: 20,
    backgroundColor: '#fafafa',
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  button: {
    marginVertical: 5,
    backgroundColor: '#4682b4',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
    color: '#333',
  },
  logItem: {
    padding: 15,
    borderColor: '#4682b4',
    borderWidth: 1,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  logItemText: {
    fontSize: 16,
    color: '#333',
  },
});
