#include <iostream>
#include <fstream>
using namespace std;

class temp {
    string username, Email, Password;
    string searchname, searchpass, searchEmail;
    fstream file;

public:
    void signup();
    void login();
    void forgetpass();
};

int main() {
    char choice;
    temp obj;

    cout << "\n1 - Sign up";
    cout << "\n2 - Log in";
    cout << "\n3 - Forget password";
    cout << "\n4 - Exit" << endl << endl;
    cout << "Enter your choice: ";
    cin >> choice;
    cin.ignore();

    switch (choice) {
        case '1':
            obj.signup();
            break;
        case '2':
            obj.login();
            break;
        case '3':
            obj.forgetpass();
            break;
        case '4':
            return 0;
        default:
            cout << "Invalid choice";
    }
}

void temp::signup() {
    cout << "Enter your username: ";
    getline(cin, username);
    cout << "Enter your Email address: ";
    getline(cin, Email);
    cout << "Enter your password: ";
    getline(cin, Password);

    file.open("Logindata1.txt", ios::out | ios::app);
    file << username << "*" << Email << "*" << Password << endl;
    file.close();

    cout << "Signup successful!" << endl;
}

void temp::login() {
    cout << "--------------------LOGIN------------------------" << endl;
    cout << "Enter your username: ";
    getline(cin, searchname);
    cout << "Enter your password: ";
    getline(cin, searchpass);

    file.open("Logindata1.txt", ios::in);
    bool found = false;

    while (getline(file, username, '*') &&
           getline(file, Email, '*') &&
           getline(file, Password, '\n')) {
        if (username == searchname && Password == searchpass) {
            found = true;
            break;
        }
    }

    file.close();

    if (found) {
        cout << "\nLogin successful!" << endl;
    } else {
        cout << "User not found or incorrect password." << endl;
    }
}

void temp::forgetpass() {
    cout << "Enter your username: ";
    getline(cin, searchname);
    cout << "Enter your Email address: ";
    getline(cin, searchEmail);

    file.open("Logindata1.txt", ios::in);
    bool found = false;

    while (getline(file, username, '*') &&
           getline(file, Email, '*') &&
           getline(file, Password, '\n')) {
        if (username == searchname && Email == searchEmail) {
            cout << "Account found!" << endl;
            cout << "Your password: " << Password << endl;
            found = true;
            break;
        }
    }

    file.close();

    if (!found) {
        cout << "Email not found!" << endl;
    }
}