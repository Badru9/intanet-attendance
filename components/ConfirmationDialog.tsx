import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CustomConfirmationModalProps {
  isVisible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
}

const CustomConfirmationModal: React.FC<CustomConfirmationModalProps> = ({
  isVisible,
  onConfirm,
  onCancel,
  title = 'Apakah anda yakin melakukan pengajuan ini?',
}) => {
  return (
    <Modal
      animationType='fade'
      transparent={true}
      visible={isVisible}
      onRequestClose={onCancel}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>{title}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonCancel]}
              onPress={onCancel}
            >
              <Text style={styles.textCancel}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonConfirm]}
              onPress={onConfirm}
            >
              <Text style={styles.textConfirm}>Yakin</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Background overlay
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 15,
  },
  button: {
    borderRadius: 12,
    padding: 12,
    flex: 1,
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: '#FF3B30',
  },
  buttonConfirm: {
    backgroundColor: '#007AFF',
  },
  textCancel: {
    color: 'white',
    fontWeight: 'bold',
  },
  textConfirm: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default CustomConfirmationModal;
